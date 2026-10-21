$ErrorActionPreference = "Stop"

function Assert-Condition($condition, $message) {
    if (-not $condition) {
        Write-Error "ASSERTION FAILED: $message"
        exit 1
    }
    Write-Host "  PASS: $message" -ForegroundColor Green
}

$baseUrl = "http://localhost:8080/api/v1"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "PHASE 5 LIVE DOCKER API VERIFICATION" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Health check
$health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
Assert-Condition ($health.data.status -eq "UP") "Health check returns UP"

# 2. Login as OWNER
$ownerLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{
    email = "owner@shiftops.com"
    password = "Password123!"
} | ConvertTo-Json) -ContentType "application/json"
$ownerToken = $ownerLogin.data.accessToken
Assert-Condition ($ownerToken -ne $null) "Owner login successful"

# 3. Create or Fetch Branches (Alpha and Beta)
$branches = Invoke-RestMethod -Uri "$baseUrl/branches" -Method Get -Headers @{ Authorization = "Bearer $ownerToken" }
$branchAlpha = $branches.data | Where-Object { $_.name -like "*Alpha*" } | Select-Object -First 1
if (-not $branchAlpha) {
    $createBranch = Invoke-RestMethod -Uri "$baseUrl/branches" -Method Post -Headers @{ Authorization = "Bearer $ownerToken" } -Body (@{
        name = "Alpha Branch " + (Get-Random -Maximum 9999)
        timezone = "UTC"
    } | ConvertTo-Json) -ContentType "application/json"
    $branchAlpha = $createBranch.data
}
$branchBeta = $branches.data | Where-Object { $_.name -like "*Beta*" } | Select-Object -First 1
if (-not $branchBeta) {
    $createBranch = Invoke-RestMethod -Uri "$baseUrl/branches" -Method Post -Headers @{ Authorization = "Bearer $ownerToken" } -Body (@{
        name = "Beta Branch " + (Get-Random -Maximum 9999)
        timezone = "UTC"
    } | ConvertTo-Json) -ContentType "application/json"
    $branchBeta = $createBranch.data
}
Assert-Condition ($branchAlpha -ne $null -and $branchBeta -ne $null) "Branches Alpha and Beta identified"

# 4. Create Manager & Staff for Branch Alpha
$rand = Get-Random -Maximum 99999
$mgrEmail = "mgr.alpha.$rand@shiftops.com"
$staff1Email = "staff1.alpha.$rand@shiftops.com"
$staff2Email = "staff2.alpha.$rand@shiftops.com"
$betaMgrEmail = "mgr.beta.$rand@shiftops.com"

# Create Alpha Manager
$mgrRes = Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -Headers @{ Authorization = "Bearer $ownerToken" } -Body (@{
    email = $mgrEmail
    fullName = "Alpha Manager $rand"
    role = "MANAGER"
    primaryBranchId = $branchAlpha.id
    password = "Password123!"
} | ConvertTo-Json) -ContentType "application/json"
$mgrId = $mgrRes.data.id

# Create Staff 1
$s1Res = Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -Headers @{ Authorization = "Bearer $ownerToken" } -Body (@{
    email = $staff1Email
    fullName = "Staff 1 Alpha $rand"
    role = "STAFF"
    primaryBranchId = $branchAlpha.id
    password = "Password123!"
} | ConvertTo-Json) -ContentType "application/json"
$staff1Id = $s1Res.data.id

# Create Staff 2
$s2Res = Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -Headers @{ Authorization = "Bearer $ownerToken" } -Body (@{
    email = $staff2Email
    fullName = "Staff 2 Alpha $rand"
    role = "STAFF"
    primaryBranchId = $branchAlpha.id
    password = "Password123!"
} | ConvertTo-Json) -ContentType "application/json"
$staff2Id = $s2Res.data.id

# Create Beta Manager
$betaMgrRes = Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -Headers @{ Authorization = "Bearer $ownerToken" } -Body (@{
    email = $betaMgrEmail
    fullName = "Beta Manager $rand"
    role = "MANAGER"
    primaryBranchId = $branchBeta.id
    password = "Password123!"
} | ConvertTo-Json) -ContentType "application/json"

# Logins
$mgrLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ email = $mgrEmail; password = "Password123!" } | ConvertTo-Json) -ContentType "application/json"
$mgrToken = $mgrLogin.data.accessToken

$staff1Login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ email = $staff1Email; password = "Password123!" } | ConvertTo-Json) -ContentType "application/json"
$staff1Token = $staff1Login.data.accessToken

$staff2Login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ email = $staff2Email; password = "Password123!" } | ConvertTo-Json) -ContentType "application/json"
$staff2Token = $staff2Login.data.accessToken

$betaMgrLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ email = $betaMgrEmail; password = "Password123!" } | ConvertTo-Json) -ContentType "application/json"
$betaMgrToken = $betaMgrLogin.data.accessToken

Assert-Condition ($mgrToken -and $staff1Token -and $staff2Token -and $betaMgrToken) "All test users authenticated"

# 5. Create Task Template for Alpha Branch
Write-Host "`n-- Testing Task Template Creation & Isolation --" -ForegroundColor Yellow
$tplReq = @{
    name = "Daily Opening Checklist $rand"
    description = "Morning shift opening checklist"
    items = @(
        @{ title = "Check refrigeration temps"; priority = "HIGH"; orderIndex = 0 },
        @{ title = "Turn on registers"; priority = "NORMAL"; orderIndex = 1 },
        @{ title = "Sweep entrance floor"; priority = "LOW"; orderIndex = 2 }
    )
} | ConvertTo-Json

$tplRes = Invoke-RestMethod -Uri "$baseUrl/branches/$($branchAlpha.id)/task-templates" -Method Post -Headers @{ Authorization = "Bearer $mgrToken" } -Body $tplReq -ContentType "application/json"
$templateId = $tplRes.data.id
Assert-Condition ($tplRes.data.items.Count -eq 3) "Task template created with 3 checklist items"

# 6. Branch Isolation: Beta manager cannot access Alpha template
$isolated = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/task-templates/$templateId" -Method Get -Headers @{ Authorization = "Bearer $betaMgrToken" }
} catch {
    $isolated = ($_.Exception.Response.StatusCode.value__ -eq 403)
}
Assert-Condition ($isolated) "Beta manager blocked from accessing Alpha branch template (HTTP 403)"

# 7. Create Shift & Assign Staff 1 and Staff 2
Write-Host "`n-- Creating Shift and Assigning Staff --" -ForegroundColor Yellow
$shiftStart = (Get-Date).ToUniversalTime().AddHours(2).ToString("yyyy-MM-ddTHH:mm:00Z")
$shiftEnd = (Get-Date).ToUniversalTime().AddHours(10).ToString("yyyy-MM-ddTHH:mm:00Z")
$shiftRes = Invoke-RestMethod -Uri "$baseUrl/branches/$($branchAlpha.id)/shifts" -Method Post -Headers @{ Authorization = "Bearer $mgrToken" } -Body (@{
    name = "Morning Shift $rand"
    startTime = $shiftStart
    endTime = $shiftEnd
    notes = "Phase 5 verification shift"
} | ConvertTo-Json) -ContentType "application/json"
$shiftId = $shiftRes.data.id

# Publish Shift
Invoke-RestMethod -Uri "$baseUrl/shifts/$shiftId/status" -Method Patch -Headers @{ Authorization = "Bearer $mgrToken" } -Body (@{ status = "PUBLISHED" } | ConvertTo-Json) -ContentType "application/json"

# Assign Staff 1 and Staff 2
$asgn1 = Invoke-RestMethod -Uri "$baseUrl/shifts/$shiftId/assignments" -Method Post -Headers @{ Authorization = "Bearer $mgrToken" } -Body (@{ userId = $staff1Id } | ConvertTo-Json) -ContentType "application/json"
$asgn2 = Invoke-RestMethod -Uri "$baseUrl/shifts/$shiftId/assignments" -Method Post -Headers @{ Authorization = "Bearer $mgrToken" } -Body (@{ userId = $staff2Id } | ConvertTo-Json) -ContentType "application/json"
$asgn1Id = ($asgn1.data.assignments | Where-Object { $_.userId -eq $staff1Id }).id
$asgn2Id = ($asgn2.data.assignments | Where-Object { $_.userId -eq $staff2Id }).id
Assert-Condition ($asgn1Id -and $asgn2Id) "Staff 1 and Staff 2 assigned to Shift"

# 8. Generate Tasks from Template
Write-Host "`n-- Generating Tasks for Shift --" -ForegroundColor Yellow
$genRes = Invoke-RestMethod -Uri "$baseUrl/shifts/$shiftId/tasks/generate" -Method Post -Headers @{ Authorization = "Bearer $mgrToken" } -Body (@{ templateId = $templateId } | ConvertTo-Json) -ContentType "application/json"
Assert-Condition ($genRes.data.Count -eq 6) "Generated 6 tasks (3 checklist items * 2 assigned staff)"

# 9. Idempotency Check: Generating again produces no duplicates (total tasks remains 6)
$genAgain = Invoke-RestMethod -Uri "$baseUrl/shifts/$shiftId/tasks/generate" -Method Post -Headers @{ Authorization = "Bearer $mgrToken" } -Body (@{ templateId = $templateId } | ConvertTo-Json) -ContentType "application/json"
Assert-Condition ($genAgain.data.Count -eq 6) "Task generation is idempotent (total tasks remain 6, no duplicates created)"

# 10. Add Ad-Hoc Task for Staff 1
Write-Host "`n-- Creating Ad-Hoc Task --" -ForegroundColor Yellow
$adhocRes = Invoke-RestMethod -Uri "$baseUrl/shift-assignments/$asgn1Id/tasks" -Method Post -Headers @{ Authorization = "Bearer $mgrToken" } -Body (@{
    title = "Clean emergency oil spill"
    description = "Spill in aisle 3"
    priority = "HIGH"
} | ConvertTo-Json) -ContentType "application/json"
$adhocTaskId = $adhocRes.data.id
Assert-Condition ($adhocRes.data.templateItemId -eq $null -and $adhocRes.data.title -eq "Clean emergency oil spill") "Ad-hoc task created successfully"

# 11. Staff Task Isolation: Staff 1 views only own tasks
Write-Host "`n-- Testing Staff Task Isolation & Status Workflow --" -ForegroundColor Yellow
$s1Tasks = Invoke-RestMethod -Uri "$baseUrl/tasks/my" -Method Get -Headers @{ Authorization = "Bearer $staff1Token" }
Assert-Condition ($s1Tasks.data.Count -eq 4) "Staff 1 views exactly 4 assigned tasks (3 from template + 1 ad-hoc)"
$s1TaskIds = $s1Tasks.data | ForEach-Object { $_.id }
Assert-Condition ($s1TaskIds -notcontains $genRes.data[3].id) "Staff 1 cannot see Staff 2 tasks in My Tasks"

# 12. Staff 1 updates task: TODO -> IN_PROGRESS -> COMPLETED
$targetTask = $s1Tasks.data | Where-Object { $_.priority -eq "HIGH" -and $_.templateItemId -ne $null } | Select-Object -First 1
$tId = $targetTask.id

# Transition to IN_PROGRESS
$inProgRes = Invoke-RestMethod -Uri "$baseUrl/tasks/$tId/status" -Method Patch -Headers @{ Authorization = "Bearer $staff1Token" } -Body (@{ status = "IN_PROGRESS" } | ConvertTo-Json) -ContentType "application/json"
Assert-Condition ($inProgRes.data.status -eq "IN_PROGRESS" -and $inProgRes.data.completedAt -eq $null) "Task transitioned to IN_PROGRESS (completedAt is null)"

# Transition to COMPLETED
$compRes = Invoke-RestMethod -Uri "$baseUrl/tasks/$tId/status" -Method Patch -Headers @{ Authorization = "Bearer $staff1Token" } -Body (@{ status = "COMPLETED" } | ConvertTo-Json) -ContentType "application/json"
Assert-Condition ($compRes.data.status -eq "COMPLETED" -and $compRes.data.completedAt -ne $null) "Task transitioned to COMPLETED with server-generated completedAt timestamp ($($compRes.data.completedAt))"

# 13. Invalid Transition Rejection: COMPLETED -> TODO
$invalidTransition = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/tasks/$tId/status" -Method Patch -Headers @{ Authorization = "Bearer $staff1Token" } -Body (@{ status = "TODO" } | ConvertTo-Json) -ContentType "application/json"
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    $invalidTransition = ($code -eq 422 -or $code -eq 400)
}
Assert-Condition ($invalidTransition) "Invalid transition COMPLETED -> TODO rejected (HTTP 422/400)"

# 14. Access Control Rejection: Staff 1 cannot modify Staff 2 task
$staff2Task = $genRes.data | Where-Object { $_.userId -eq $staff2Id } | Select-Object -First 1
$forbiddenUpdate = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/tasks/$($staff2Task.id)/status" -Method Patch -Headers @{ Authorization = "Bearer $staff1Token" } -Body (@{ status = "IN_PROGRESS" } | ConvertTo-Json) -ContentType "application/json"
} catch {
    $forbiddenUpdate = ([int]$_.Exception.Response.StatusCode -eq 403)
}
Assert-Condition ($forbiddenUpdate) "Staff 1 forbidden from updating Staff 2 task (HTTP 403)"

# 15. Manager Branch Monitoring
Write-Host "`n-- Testing Manager Monitoring & Shift Cancellation --" -ForegroundColor Yellow
$mgrBranchTasks = Invoke-RestMethod -Uri "$baseUrl/branches/$($branchAlpha.id)/tasks" -Method Get -Headers @{ Authorization = "Bearer $mgrToken" }
Assert-Condition ($mgrBranchTasks.data.Count -ge 7) "Manager can monitor all branch tasks across staff"

# 16. Assignment Deletion Safety: Cannot remove assignment with COMPLETED tasks
$asgnDeleteBlocked = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/shifts/$shiftId/assignments/$staff1Id" -Method Delete -Headers @{ Authorization = "Bearer $mgrToken" }
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    $asgnDeleteBlocked = ($code -eq 422 -or $code -eq 400)
}
Assert-Condition ($asgnDeleteBlocked) "Cannot remove shift assignment with COMPLETED tasks (HTTP 422/400)"

# 17. Shift Cancellation Cascade: Incomplete tasks become CANCELLED, COMPLETED task preserved
Invoke-RestMethod -Uri "$baseUrl/shifts/$shiftId/status" -Method Patch -Headers @{ Authorization = "Bearer $mgrToken" } -Body (@{ status = "CANCELLED" } | ConvertTo-Json) -ContentType "application/json"

$cancelledShiftTasks = Invoke-RestMethod -Uri "$baseUrl/shifts/$shiftId/tasks" -Method Get -Headers @{ Authorization = "Bearer $mgrToken" }
$completedPreserved = ($cancelledShiftTasks.data | Where-Object { $_.id -eq $tId }).status -eq "COMPLETED"
$incompleteCancelled = ($cancelledShiftTasks.data | Where-Object { $_.id -ne $tId } | Where-Object { $_.status -ne "CANCELLED" }).Count -eq 0
Assert-Condition ($completedPreserved) "Completed task remains COMPLETED upon shift cancellation"
Assert-Condition ($incompleteCancelled) "All incomplete tasks transitioned to CANCELLED upon shift cancellation"

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "ALL PHASE 5 VERIFICATION CHECKS PASSED! 🚀" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
