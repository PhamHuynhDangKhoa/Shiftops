# verify_phase4.ps1
$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api/v1"
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   PHASE 4: LIVE ATTENDANCE VERIFICATION   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Health check
Write-Host "`n[1] Checking GET /health..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
Write-Host "Health Status: $($health.data.status), DB: $($health.data.database), Version: $($health.data.version)" -ForegroundColor Green
if ($health.data.status -ne "UP") { throw "Health is not UP" }

# 2. Login as OWNER
Write-Host "`n[2] Logging in as OWNER..." -ForegroundColor Yellow
$ownerLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body (@{
    email = "owner@shiftops.com"
    password = "Password123!"
} | ConvertTo-Json)
$ownerToken = $ownerLogin.data.accessToken
Write-Host "OWNER Login successful: $($ownerLogin.data.user.fullName)" -ForegroundColor Green

# 3. Login as MANAGER
Write-Host "`n[3] Logging in as MANAGER..." -ForegroundColor Yellow
$mgrLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body (@{
    email = "manager@shiftops.com"
    password = "Password123!"
} | ConvertTo-Json)
$mgrToken = $mgrLogin.data.accessToken
$branchId = $mgrLogin.data.user.primaryBranchId
Write-Host "MANAGER Login successful: $($mgrLogin.data.user.fullName), Branch ID: $branchId" -ForegroundColor Green

$ownerHeaders = @{ Authorization = "Bearer $ownerToken" }
$mgrHeaders = @{ Authorization = "Bearer $mgrToken" }

# Helper to create and login staff
function CreateAndLoginStaff($tag) {
    $t = [DateTime]::UtcNow.Ticks
    $email = "staff.$tag.$t@shiftops.com"
    $create = Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -Headers $mgrHeaders -ContentType "application/json" -Body (@{
        email = $email
        password = "Password123!"
        fullName = "Test Staff $tag"
        phone = "+15550001111"
        role = "STAFF"
        primaryBranchId = $branchId
    } | ConvertTo-Json)
    $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body (@{
        email = $email
        password = "Password123!"
    } | ConvertTo-Json)
    return @{
        id = $create.data.id
        email = $email
        token = $login.data.accessToken
        headers = @{ Authorization = "Bearer $($login.data.accessToken)" }
    }
}

# 4. Create and Login On-Time Staff
Write-Host "`n[4] Creating dedicated OnTime test staff..." -ForegroundColor Yellow
$onTimeStaff = CreateAndLoginStaff "ontime"
Write-Host "OnTime Staff created & logged in: $($onTimeStaff.email)" -ForegroundColor Green

# 5. Create On-Time Shift (starts in 5 mins -> within 15-min early window)
Write-Host "`n[5] Creating On-Time Shift (starts in 5 min, ends in 4 hr)..." -ForegroundColor Yellow
$nowUtc = [DateTime]::UtcNow
$shiftStart = $nowUtc.AddMinutes(5).ToString("yyyy-MM-ddTHH:mm:ssZ")
$shiftEnd = $nowUtc.AddHours(4).ToString("yyyy-MM-ddTHH:mm:ssZ")

$createdShift = Invoke-RestMethod -Uri "$baseUrl/branches/$branchId/shifts" -Method Post -Headers $mgrHeaders -ContentType "application/json" -Body (@{
    name = "Live Test Shift OnTime"
    startTime = $shiftStart
    endTime = $shiftEnd
    notes = "Live test shift for on-time check-in"
} | ConvertTo-Json)
$shiftId = $createdShift.data.id
Write-Host "Shift created: ID=$shiftId" -ForegroundColor Green

# 6. Assign Staff to Shift
Write-Host "`n[6] Assigning OnTime Staff to shift..." -ForegroundColor Yellow
$assignedShift = Invoke-RestMethod -Uri "$baseUrl/shifts/$shiftId/assignments" -Method Post -Headers $mgrHeaders -ContentType "application/json" -Body (@{
    userId = $onTimeStaff.id
} | ConvertTo-Json)
$assignmentId = $assignedShift.data.assignments[0].id
Write-Host "Staff assigned: Assignment ID=$assignmentId" -ForegroundColor Green

# 7. Publish Shift
Write-Host "`n[7] Publishing shift..." -ForegroundColor Yellow
$publishedShift = Invoke-RestMethod -Uri "$baseUrl/shifts/$shiftId/status" -Method Patch -Headers $mgrHeaders -ContentType "application/json" -Body (@{ status = "PUBLISHED" } | ConvertTo-Json)
Write-Host "Shift published. Status=$($publishedShift.data.status)" -ForegroundColor Green

# 8. Staff Check-In (now <= shiftStart -> PRESENT, late=false)
Write-Host "`n[8] Staff checking in (now <= startTime -> PRESENT)..." -ForegroundColor Yellow
$checkInRes = Invoke-RestMethod -Uri "$baseUrl/attendance/$assignmentId/check-in" -Method Post -Headers $onTimeStaff.headers
Write-Host "Check-In Success! Attendance ID: $($checkInRes.data.id), Status: $($checkInRes.data.status), late: $($checkInRes.data.late), checkInAt: $($checkInRes.data.checkInAt)" -ForegroundColor Green
if ($checkInRes.data.status -ne "PRESENT" -or $checkInRes.data.late -ne $false) {
    throw "Expected status PRESENT and late=false, got status=$($checkInRes.data.status), late=$($checkInRes.data.late)"
}

# 9. Verify Double Check-In returns 409 Conflict
Write-Host "`n[9] Verifying double check-in is rejected (409 Conflict)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/attendance/$assignmentId/check-in" -Method Post -Headers $onTimeStaff.headers
    throw "Double check-in should have failed with 409!"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Double check-in rejected as expected with HTTP $statusCode" -ForegroundColor Green
    if ($statusCode -ne 409) { throw "Expected 409, got $statusCode" }
}

# 10. Staff Check-Out
Write-Host "`n[10] Staff checking out..." -ForegroundColor Yellow
$checkOutRes = Invoke-RestMethod -Uri "$baseUrl/attendance/$assignmentId/check-out" -Method Post -Headers $onTimeStaff.headers
Write-Host "Check-Out Success! Status: $($checkOutRes.data.status), checkOutAt: $($checkOutRes.data.checkOutAt)" -ForegroundColor Green
if ($checkOutRes.data.status -ne "COMPLETED") {
    throw "Expected status COMPLETED, got status=$($checkOutRes.data.status)"
}

# 11. Verify Double Check-Out returns 422 Unprocessable Entity
Write-Host "`n[11] Verifying double check-out is rejected (422 Unprocessable Entity)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/attendance/$assignmentId/check-out" -Method Post -Headers $onTimeStaff.headers
    throw "Double check-out should have failed with 422!"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Double check-out rejected as expected with HTTP $statusCode" -ForegroundColor Green
    if ($statusCode -ne 422) { throw "Expected 422, got $statusCode" }
}

# 12. Test Check-In Window Violation (Too early: shift starts in 2 days)
Write-Host "`n[12] Testing check-in window violation (future shift > 15m away)..." -ForegroundColor Yellow
$futureStaff = CreateAndLoginStaff "future"
$futureShiftStart = $nowUtc.AddDays(2).ToString("yyyy-MM-ddTHH:mm:ssZ")
$futureShiftEnd = $nowUtc.AddDays(2).AddHours(8).ToString("yyyy-MM-ddTHH:mm:ssZ")
$futureShift = Invoke-RestMethod -Uri "$baseUrl/branches/$branchId/shifts" -Method Post -Headers $mgrHeaders -ContentType "application/json" -Body (@{
    name = "Future Shift Test"
    startTime = $futureShiftStart
    endTime = $futureShiftEnd
} | ConvertTo-Json)
$futureShiftId = $futureShift.data.id

$assignedFuture = Invoke-RestMethod -Uri "$baseUrl/shifts/$futureShiftId/assignments" -Method Post -Headers $mgrHeaders -ContentType "application/json" -Body (@{
    userId = $futureStaff.id
} | ConvertTo-Json)
$futureAssignmentId = $assignedFuture.data.assignments[0].id
Invoke-RestMethod -Uri "$baseUrl/shifts/$futureShiftId/status" -Method Patch -Headers $mgrHeaders -ContentType "application/json" -Body (@{ status = "PUBLISHED" } | ConvertTo-Json) | Out-Null

try {
    Invoke-RestMethod -Uri "$baseUrl/attendance/$futureAssignmentId/check-in" -Method Post -Headers $futureStaff.headers
    throw "Early check-in should have failed with 422!"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Early check-in rejected as expected with HTTP $statusCode (Window not yet open)" -ForegroundColor Green
    if ($statusCode -ne 422) { throw "Expected 422, got $statusCode" }
}

# 13. Test LATE Check-In (Shift started 10 minutes ago)
Write-Host "`n[13] Testing late check-in (shift started 10m ago)..." -ForegroundColor Yellow
$lateStaff = CreateAndLoginStaff "late"
$lateShiftStart = $nowUtc.AddMinutes(-10).ToString("yyyy-MM-ddTHH:mm:ssZ")
$lateShiftEnd = $nowUtc.AddHours(2).ToString("yyyy-MM-ddTHH:mm:ssZ")
$lateShift = Invoke-RestMethod -Uri "$baseUrl/branches/$branchId/shifts" -Method Post -Headers $mgrHeaders -ContentType "application/json" -Body (@{
    name = "Late Test Shift"
    startTime = $lateShiftStart
    endTime = $lateShiftEnd
} | ConvertTo-Json)
$lateShiftId = $lateShift.data.id

$assignedLate = Invoke-RestMethod -Uri "$baseUrl/shifts/$lateShiftId/assignments" -Method Post -Headers $mgrHeaders -ContentType "application/json" -Body (@{
    userId = $lateStaff.id
} | ConvertTo-Json)
$lateAssignmentId = $assignedLate.data.assignments[0].id
Invoke-RestMethod -Uri "$baseUrl/shifts/$lateShiftId/status" -Method Patch -Headers $mgrHeaders -ContentType "application/json" -Body (@{ status = "PUBLISHED" } | ConvertTo-Json) | Out-Null

$lateCheckInRes = Invoke-RestMethod -Uri "$baseUrl/attendance/$lateAssignmentId/check-in" -Method Post -Headers $lateStaff.headers
Write-Host "Late Check-In Success! Status: $($lateCheckInRes.data.status), late: $($lateCheckInRes.data.late)" -ForegroundColor Green
if ($lateCheckInRes.data.status -ne "LATE" -or $lateCheckInRes.data.late -ne $true) {
    throw "Expected status LATE and late=true, got status=$($lateCheckInRes.data.status), late=$($lateCheckInRes.data.late)"
}

# 14. Staff querying own attendance (/attendance/my)
Write-Host "`n[14] Staff querying own attendance records (/attendance/my)..." -ForegroundColor Yellow
$myAttendance = Invoke-RestMethod -Uri "$baseUrl/attendance/my" -Method Get -Headers $onTimeStaff.headers
Write-Host "Found $($myAttendance.data.Count) personal attendance record for on-time staff" -ForegroundColor Green
if ($myAttendance.data.Count -lt 1) { throw "Expected at least 1 attendance record for staff" }

# 15. Manager querying branch attendance (/branches/{id}/attendance)
Write-Host "`n[15] Manager querying branch attendance records..." -ForegroundColor Yellow
$branchAtt = Invoke-RestMethod -Uri "$baseUrl/branches/$branchId/attendance" -Method Get -Headers $mgrHeaders
Write-Host "Found $($branchAtt.data.Count) branch attendance records" -ForegroundColor Green
if ($branchAtt.data.Count -lt 2) { throw "Expected at least 2 branch attendance records" }

# 16. Verify Staff forbidden from viewing branch attendance (403 Forbidden)
Write-Host "`n[16] Verifying STAFF forbidden from viewing branch attendance endpoint (403)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/branches/$branchId/attendance" -Method Get -Headers $onTimeStaff.headers
    throw "Staff should not be authorized to view branch attendance endpoint!"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Access denied to staff as expected with HTTP $statusCode" -ForegroundColor Green
    if ($statusCode -ne 403) { throw "Expected 403, got $statusCode" }
}

# 17. Overnight Shift Attendance Check
Write-Host "`n[17] Testing Overnight Shift Attendance..." -ForegroundColor Yellow
$overnightStaff = CreateAndLoginStaff "overnight"
$overnightStart = [DateTime]::UtcNow.Date.AddDays(-1).AddHours(22).ToString("yyyy-MM-ddTHH:mm:ssZ")
$overnightEnd = [DateTime]::UtcNow.Date.AddHours(10).ToString("yyyy-MM-ddTHH:mm:ssZ")
$overnightShift = Invoke-RestMethod -Uri "$baseUrl/branches/$branchId/shifts" -Method Post -Headers $mgrHeaders -ContentType "application/json" -Body (@{
    name = "Live Overnight Shift"
    startTime = $overnightStart
    endTime = $overnightEnd
} | ConvertTo-Json)
$overnightShiftId = $overnightShift.data.id

$assignedOvernight = Invoke-RestMethod -Uri "$baseUrl/shifts/$overnightShiftId/assignments" -Method Post -Headers $mgrHeaders -ContentType "application/json" -Body (@{
    userId = $overnightStaff.id
} | ConvertTo-Json)
$overnightAssignmentId = $assignedOvernight.data.assignments[0].id
Invoke-RestMethod -Uri "$baseUrl/shifts/$overnightShiftId/status" -Method Patch -Headers $mgrHeaders -ContentType "application/json" -Body (@{ status = "PUBLISHED" } | ConvertTo-Json) | Out-Null

$overnightAttRes = Invoke-RestMethod -Uri "$baseUrl/attendance/$overnightAssignmentId/check-in" -Method Post -Headers $overnightStaff.headers
Write-Host "Overnight Check-In Success! Status: $($overnightAttRes.data.status), overnight: $($overnightAttRes.data.overnight)" -ForegroundColor Green
if ($overnightAttRes.data.overnight -ne $true) {
    throw "Expected overnight=true"
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "  ALL 17 PHASE 4 LIVE VERIFICATION CHECKS PASSED! ✅  " -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
