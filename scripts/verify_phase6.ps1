$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "    PHASE 6: ISSUE MANAGEMENT LIVE E2E VERIFICATION" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Login helper
function Get-Token($email, $password) {
    $body = @{ email = $email; password = $password } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
    return $res.data.accessToken
}

Write-Host "`n[1] Authenticating users..." -ForegroundColor Yellow
$ownerToken = Get-Token "owner@shiftops.com" "Password123!"
$managerToken = Get-Token "manager@shiftops.com" "Password123!"
$staffToken = Get-Token "staff@shiftops.com" "Password123!"
Write-Host "✓ Tokens acquired for Owner, Manager, and Staff." -ForegroundColor Green

# 2. Get branches
$branchesRes = Invoke-RestMethod -Uri "$baseUrl/v1/branches" -Method Get -Headers @{ Authorization = "Bearer $ownerToken" }
$mainBranch = $branchesRes.data | Where-Object { $_.name -like "*Main*" } | Select-Object -First 1
$northBranch = $branchesRes.data | Where-Object { $_.name -like "*North*" } | Select-Object -First 1

if (-not $mainBranch -or -not $northBranch) {
    Write-Host "ERROR: Branches not found!" -ForegroundColor Red
    exit 1
}

$mainBranchId = $mainBranch.id
$northBranchId = $northBranch.id
Write-Host "Main Branch: $mainBranchId ($($mainBranch.name))" -ForegroundColor Gray
Write-Host "North Branch: $northBranchId ($($northBranch.name))" -ForegroundColor Gray

# 3. Get Staff info
$staffProfile = Invoke-RestMethod -Uri "$baseUrl/v1/users/me" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
$staffUserId = $staffProfile.data.id
Write-Host "Staff User ID: $staffUserId ($($staffProfile.data.fullName))" -ForegroundColor Gray

# 4. Staff reports issue at Main Branch
Write-Host "`n[2] Staff reports issue at Main Branch [POST /v1/issues]..." -ForegroundColor Yellow
$reportIssueBody = @{
    branchId = $mainBranchId
    title = "E2E Live: Steam Wand Leaking Boiling Water"
    description = "Gasket is ruptured and steam pressure is venting uncontrollably."
    category = "EQUIPMENT"
    priority = "URGENT"
} | ConvertTo-Json

$createRes = Invoke-RestMethod -Uri "$baseUrl/v1/issues" -Method Post -Headers @{ Authorization = "Bearer $staffToken" } -Body $reportIssueBody -ContentType "application/json"
$issue = $createRes.data
$issueId = $issue.id

if ($issue.title -ne "E2E Live: Steam Wand Leaking Boiling Water" -or $issue.status -ne "OPEN" -or $issue.reportedById -ne $staffUserId) {
    Write-Host "FAILED: Issue creation mismatch!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Issue created successfully: ID=$issueId, Status=$($issue.status), Priority=$($issue.priority)" -ForegroundColor Green

# 5. Security check: Staff reports for another branch (North Branch) -> Must be 403 Forbidden
Write-Host "`n[3] Security Pre-Check: Staff attempts cross-branch issue creation..." -ForegroundColor Yellow
try {
    $illegalBody = @{
        branchId = $northBranchId
        title = "Illegal Cross Branch Issue"
        description = "Should fail"
        category = "SAFETY"
        priority = "HIGH"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/v1/issues" -Method Post -Headers @{ Authorization = "Bearer $staffToken" } -Body $illegalBody -ContentType "application/json"
    Write-Host "FAILED: Cross branch issue creation should have returned 403 Forbidden!" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "✓ Cross-branch creation properly rejected with HTTP 403 Forbidden." -ForegroundColor Green
    } else {
        Write-Host "FAILED: Unexpected status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        exit 1
    }
}

# 6. Manager Branch Scoping Check
Write-Host "`n[4] Manager Branch Scoping Check..." -ForegroundColor Yellow
# Manager queries Main Branch -> 200 OK
$mgrMainList = Invoke-RestMethod -Uri "$baseUrl/v1/branches/$mainBranchId/issues" -Method Get -Headers @{ Authorization = "Bearer $managerToken" }
Write-Host "✓ Manager successfully retrieved Main Branch issues (Found: $($mgrMainList.data.totalElements))" -ForegroundColor Green

# Manager queries North Branch -> 403 Forbidden
try {
    Invoke-RestMethod -Uri "$baseUrl/v1/branches/$northBranchId/issues" -Method Get -Headers @{ Authorization = "Bearer $managerToken" }
    Write-Host "FAILED: Manager accessing other branch should have returned 403 Forbidden!" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "✓ Manager querying other branch properly rejected with HTTP 403 Forbidden." -ForegroundColor Green
    } else {
        Write-Host "FAILED: Unexpected status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        exit 1
    }
}

# Owner queries North Branch -> 200 OK (Global scope)
$ownerNorthList = Invoke-RestMethod -Uri "$baseUrl/v1/branches/$northBranchId/issues" -Method Get -Headers @{ Authorization = "Bearer $ownerToken" }
Write-Host "✓ Owner successfully queried North Branch issues across branches (Global scope)." -ForegroundColor Green

# 7. Assignment
Write-Host "`n[5] Manager assigns issue to Staff [PATCH /v1/issues/assign]..." -ForegroundColor Yellow
$assignBody = @{ assignedToUserId = $staffUserId } | ConvertTo-Json
$assignRes = Invoke-RestMethod -Uri "$baseUrl/v1/issues/$issueId/assign" -Method Patch -Headers @{ Authorization = "Bearer $managerToken" } -Body $assignBody -ContentType "application/json"

if ($assignRes.data.status -ne "ASSIGNED" -or $assignRes.data.assignedToId -ne $staffUserId) {
    Write-Host "FAILED: Assignment mismatch!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Issue assigned to staff: Status=$($assignRes.data.status), AssignedTo=$($assignRes.data.assignedToName)" -ForegroundColor Green

# 8. Full Status Workflow Progression
Write-Host "`n[6] Testing Status Lifecycle Transitions..." -ForegroundColor Yellow

# Staff transitions ASSIGNED -> IN_PROGRESS
$progressBody = @{ status = "IN_PROGRESS" } | ConvertTo-Json
$progressRes = Invoke-RestMethod -Uri "$baseUrl/v1/issues/$issueId/status" -Method Patch -Headers @{ Authorization = "Bearer $staffToken" } -Body $progressBody -ContentType "application/json"
if ($progressRes.data.status -ne "IN_PROGRESS") {
    Write-Host "FAILED: IN_PROGRESS transition failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Staff set status to IN_PROGRESS." -ForegroundColor Green

# Staff transitions IN_PROGRESS -> RESOLVED with comment
$resolveBody = @{ status = "RESOLVED"; comment = "Replaced pressure gasket and tested boiler pressure." } | ConvertTo-Json
$resolveRes = Invoke-RestMethod -Uri "$baseUrl/v1/issues/$issueId/status" -Method Patch -Headers @{ Authorization = "Bearer $staffToken" } -Body $resolveBody -ContentType "application/json"
if ($resolveRes.data.status -ne "RESOLVED" -or -not $resolveRes.data.resolvedAt -or $resolveRes.data.resolvedById -ne $staffUserId) {
    Write-Host "FAILED: RESOLVED transition or timestamps missing!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Staff set status to RESOLVED. Authoritative resolvedAt=$($resolveRes.data.resolvedAt), resolvedBy=$($resolveRes.data.resolvedByName)" -ForegroundColor Green

# Staff attempts to CLOSE issue -> 403 Forbidden
try {
    $closeBody = @{ status = "CLOSED" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/v1/issues/$issueId/status" -Method Patch -Headers @{ Authorization = "Bearer $staffToken" } -Body $closeBody -ContentType "application/json"
    Write-Host "FAILED: Staff should not be allowed to close issue!" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "✓ Staff closing issue rejected with HTTP 403 Forbidden as required." -ForegroundColor Green
    } else {
        Write-Host "FAILED: Unexpected status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        exit 1
    }
}

# Manager closes issue -> 200 OK
$mgrCloseBody = @{ status = "CLOSED"; comment = "Verified repairs on site. Espresso group operational." } | ConvertTo-Json
$mgrCloseRes = Invoke-RestMethod -Uri "$baseUrl/v1/issues/$issueId/status" -Method Patch -Headers @{ Authorization = "Bearer $managerToken" } -Body $mgrCloseBody -ContentType "application/json"
if ($mgrCloseRes.data.status -ne "CLOSED" -or -not $mgrCloseRes.data.closedAt) {
    Write-Host "FAILED: Manager closing issue failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Manager closed issue. Authoritative closedAt=$($mgrCloseRes.data.closedAt), closedBy=$($mgrCloseRes.data.closedByName)" -ForegroundColor Green

# Closed issue cannot be modified -> 422 Unprocessable Entity
try {
    $reopenBody = @{ status = "IN_PROGRESS" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/v1/issues/$issueId/status" -Method Patch -Headers @{ Authorization = "Bearer $managerToken" } -Body $reopenBody -ContentType "application/json"
    Write-Host "FAILED: Closed issue should not allow status transition!" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 422) {
        Write-Host "✓ Closed issue locked: transition correctly rejected with HTTP 422 Unprocessable Entity." -ForegroundColor Green
    } else {
        Write-Host "FAILED: Unexpected status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        exit 1
    }
}

# 9. Comments thread
Write-Host "`n[7] Testing Comments Thread & Detail Retrieval..." -ForegroundColor Yellow
$commentBody = @{ message = "Scheduled replacement part delivery confirmed." } | ConvertTo-Json
$commentRes = Invoke-RestMethod -Uri "$baseUrl/v1/issues/$issueId/comments" -Method Post -Headers @{ Authorization = "Bearer $managerToken" } -Body $commentBody -ContentType "application/json"
Write-Host "✓ Comment added: '$($commentRes.data.message)' by $($commentRes.data.authorName)" -ForegroundColor Green

# Fetch full detail
$detailRes = Invoke-RestMethod -Uri "$baseUrl/v1/issues/$issueId" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
$comments = $detailRes.data.comments
Write-Host "✓ Retrieved issue detail with $($comments.Count) comments in audit thread:" -ForegroundColor Green
foreach ($c in $comments) {
    $sysFlag = if ($c.systemGenerated) { "[SYSTEM]" } else { "[USER]" }
    Write-Host "   $sysFlag $($c.authorName) ($($c.authorRole)): $($c.message)" -ForegroundColor DarkGray
}

# 10. Attachments Upload & Retrieval
Write-Host "`n[8] Testing Image Attachment Upload & Download..." -ForegroundColor Yellow
$testImagePath = "$PSScriptRoot\temp_valve_test.png"
# Write 8-byte PNG header
[System.IO.File]::WriteAllBytes($testImagePath, [byte[]]@(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A))

try {
    # Upload via curl.exe
    $uploadUrl = "$baseUrl/v1/issues/$issueId/attachments"
    $authHeader = "Authorization: Bearer $staffToken"
    $fileParam = "file=@" + $testImagePath + ";type=image/png"
    
    $uploadOutput = & curl.exe -s -X POST $uploadUrl -H $authHeader -F $fileParam
    $uploadRes = $uploadOutput | ConvertFrom-Json
    $attachmentId = $uploadRes.data.id
    $origName = $uploadRes.data.originalFileName
    $sizeBytes = $uploadRes.data.fileSizeBytes
    Write-Host "✓ Uploaded attachment ID: $attachmentId - $origName, $sizeBytes bytes" -ForegroundColor Green

    # Download attachment file
    $downloadUrl = "$baseUrl/v1/issues/$issueId/attachments/$attachmentId/file"
    $downloadOutput = & curl.exe -s -X GET $downloadUrl -H $authHeader
    
    if (-not $downloadOutput) {
        Write-Host "FAILED: Attachment download empty!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Downloaded attachment file successfully via authenticated endpoint." -ForegroundColor Green
} finally {
    if (Test-Path $testImagePath) {
        Remove-Item $testImagePath -Force
    }
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  ALL PHASE 6 LIVE E2E VERIFICATIONS PASSED 100%!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
