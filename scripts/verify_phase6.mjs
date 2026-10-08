const baseUrl = 'http://localhost:8080/api';

console.log('==================================================');
console.log('    PHASE 6: ISSUE MANAGEMENT LIVE E2E VERIFICATION');
console.log('==================================================\n');

async function login(email, password) {
  const res = await fetch(`${baseUrl}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`);
  const json = await res.json();
  return json.data.accessToken;
}

async function run() {
  // 1. Authenticate users
  console.log('[1] Authenticating Owner, Manager, and Staff...');
  const ownerToken = await login('owner@shiftops.com', 'Password123!');
  const managerToken = await login('manager@shiftops.com', 'Password123!');
  const staffToken = await login('staff@shiftops.com', 'Password123!');
  console.log('✓ Tokens acquired.\n');

  // 2. Fetch branches
  console.log('[2] Fetching branches...');
  const branchesRes = await fetch(`${baseUrl}/v1/branches`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const branchesJson = await branchesRes.json();
  const branches = branchesJson.data;
  console.log(`Found ${branches.length} branches:`);
  branches.forEach(b => console.log(`   - ${b.id}: "${b.name}" (active: ${b.active})`));

  if (branches.length < 2) {
    throw new Error('Expected at least 2 branches for cross-branch testing');
  }

  const mainBranch = branches.find(b => b.name.includes('Main')) || branches[0];
  const northBranch = branches.find(b => b.id !== mainBranch.id) || branches[1];

  console.log(`Using Main Branch: ${mainBranch.id} (${mainBranch.name})`);
  console.log(`Using North Branch: ${northBranch.id} (${northBranch.name})\n`);

  // 3. Fetch Staff Profile
  const meRes = await fetch(`${baseUrl}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const meJson = await meRes.json();
  const staffUser = meJson.data;
  console.log(`Staff User: ${staffUser.id} (${staffUser.fullName}), Branch: ${staffUser.primaryBranchId}\n`);

  // 4. Staff reports an issue at Main Branch
  console.log('[3] Staff reports issue at Main Branch (POST /v1/issues)...');
  const createRes = await fetch(`${baseUrl}/v1/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${staffToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      branchId: mainBranch.id,
      title: 'E2E Live: Steam Wand Leaking Boiling Water',
      description: 'Gasket is ruptured and steam pressure is venting uncontrollably.',
      category: 'EQUIPMENT',
      priority: 'URGENT',
    }),
  });

  if (createRes.status !== 201) {
    const errText = await createRes.text();
    throw new Error(`Failed to create issue: ${createRes.status} - ${errText}`);
  }
  const createJson = await createRes.json();
  const issue = createJson.data;
  console.log(`✓ Issue created successfully: ID=${issue.id}, Status=${issue.status}, Priority=${issue.priority}`);

  if (issue.reportedById !== staffUser.id) {
    throw new Error(`Expected reportedById to be ${staffUser.id}, got ${issue.reportedById}`);
  }
  if (issue.branchId !== mainBranch.id) {
    throw new Error(`Expected branchId to be ${mainBranch.id}, got ${issue.branchId}`);
  }

  // 5. Cross-Branch Security Check
  console.log('\n[4] Security Check: Staff attempts cross-branch issue creation (North Branch)...');
  const crossRes = await fetch(`${baseUrl}/v1/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${staffToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      branchId: northBranch.id,
      title: 'Illegal Cross Branch Issue',
      description: 'Should be rejected',
      category: 'SAFETY',
      priority: 'HIGH',
    }),
  });

  if (crossRes.status === 403) {
    console.log('✓ Cross-branch creation properly rejected with HTTP 403 Forbidden.');
  } else {
    throw new Error(`Expected HTTP 403, got ${crossRes.status}`);
  }

  // 6. Manager Branch Scoping Check
  console.log('\n[5] Manager Branch Scoping Check...');
  const mgrMainRes = await fetch(`${baseUrl}/v1/branches/${mainBranch.id}/issues`, {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  if (mgrMainRes.status !== 200) {
    throw new Error(`Manager failed to query own branch: ${mgrMainRes.status}`);
  }
  const mgrMainJson = await mgrMainRes.json();
  console.log(`✓ Manager retrieved Main Branch issues (Total: ${mgrMainJson.data.totalElements})`);

  // Manager accessing North Branch -> 403
  const mgrNorthRes = await fetch(`${baseUrl}/v1/branches/${northBranch.id}/issues`, {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  if (mgrNorthRes.status === 403) {
    console.log('✓ Manager querying other branch properly rejected with HTTP 403 Forbidden.');
  } else {
    throw new Error(`Expected HTTP 403 for other branch, got ${mgrNorthRes.status}`);
  }

  // Owner accessing North Branch -> 200 (Global Scope)
  const ownerNorthRes = await fetch(`${baseUrl}/v1/branches/${northBranch.id}/issues`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  if (ownerNorthRes.status === 200) {
    console.log('✓ Owner queried North Branch issues across branches (Global scope).');
  } else {
    throw new Error(`Expected HTTP 200 for Owner global query, got ${ownerNorthRes.status}`);
  }

  // 7. Manager assigns issue to Staff
  console.log('\n[6] Manager assigns issue to Staff (PATCH /v1/issues/{id}/assign)...');
  const assignRes = await fetch(`${baseUrl}/v1/issues/${issue.id}/assign`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${managerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assignedToUserId: staffUser.id }),
  });
  if (assignRes.status !== 200) {
    const errText = await assignRes.text();
    throw new Error(`Assign failed: ${assignRes.status} - ${errText}`);
  }
  const assignJson = await assignRes.json();
  console.log(`✓ Issue assigned to staff: Status=${assignJson.data.status}, AssignedTo=${assignJson.data.assignedToName}`);

  // 8. Status Lifecycle Progression & Attachments
  console.log('\n[7] Testing Status Lifecycle Transitions & Attachments...');

  // Staff transitions ASSIGNED -> IN_PROGRESS
  const inProgressRes = await fetch(`${baseUrl}/v1/issues/${issue.id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${staffToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'IN_PROGRESS' }),
  });
  if (inProgressRes.status !== 200) {
    throw new Error(`IN_PROGRESS transition failed: ${inProgressRes.status}`);
  }
  console.log('✓ Staff transitioned issue to IN_PROGRESS.');

  // Staff uploads photo attachment while issue is active
  console.log('   Testing Image Attachment Upload while Active...');
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const blob = new Blob([pngHeader], { type: 'image/png' });
  const formData = new FormData();
  formData.append('file', blob, 'pressure_valve.png');

  const uploadRes = await fetch(`${baseUrl}/v1/issues/${issue.id}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: formData,
  });
  if (uploadRes.status !== 201) {
    const errText = await uploadRes.text();
    throw new Error(`Attachment upload failed: ${uploadRes.status} - ${errText}`);
  }
  const uploadJson = await uploadRes.json();
  const attachmentId = uploadJson.data.id;
  console.log(`✓ Uploaded photo attachment: ID=${attachmentId}, Name=${uploadJson.data.originalFileName}, Size=${uploadJson.data.fileSizeBytes} bytes`);

  // Download and verify attachment file
  const downloadRes = await fetch(`${baseUrl}/v1/issues/${issue.id}/attachments/${attachmentId}/file`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  if (downloadRes.status !== 200) {
    throw new Error(`Download attachment failed: ${downloadRes.status}`);
  }
  const fileBuffer = await downloadRes.arrayBuffer();
  console.log(`✓ Downloaded attachment file successfully: ${fileBuffer.byteLength} bytes received.`);

  // Staff transitions IN_PROGRESS -> RESOLVED with comment
  const resolvedRes = await fetch(`${baseUrl}/v1/issues/${issue.id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${staffToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'RESOLVED',
      comment: 'Replaced ruptured valve gasket. Pressure tested successfully at 9 bar.',
    }),
  });
  if (resolvedRes.status !== 200) {
    throw new Error(`RESOLVED transition failed: ${resolvedRes.status}`);
  }
  const resolvedJson = await resolvedRes.json();
  if (!resolvedJson.data.resolvedAt || resolvedJson.data.resolvedById !== staffUser.id) {
    throw new Error('Missing authoritative resolvedAt / resolvedById timestamps!');
  }
  console.log(`✓ Staff transitioned issue to RESOLVED. Authoritative resolvedAt=${resolvedJson.data.resolvedAt}, resolvedBy=${resolvedJson.data.resolvedByName}`);

  // Staff attempts to CLOSE issue -> 403 Forbidden
  const staffCloseRes = await fetch(`${baseUrl}/v1/issues/${issue.id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${staffToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'CLOSED' }),
  });
  if (staffCloseRes.status === 403) {
    console.log('✓ Staff attempting to close issue properly rejected with HTTP 403 Forbidden.');
  } else {
    throw new Error(`Expected HTTP 403 for staff closing issue, got ${staffCloseRes.status}`);
  }

  // Manager closes issue -> 200 OK
  const mgrCloseRes = await fetch(`${baseUrl}/v1/issues/${issue.id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${managerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'CLOSED',
      comment: 'Repairs verified during closing walkthrough. Safe for operational service.',
    }),
  });
  if (mgrCloseRes.status !== 200) {
    throw new Error(`Manager closing issue failed: ${mgrCloseRes.status}`);
  }
  const mgrCloseJson = await mgrCloseRes.json();
  if (!mgrCloseJson.data.closedAt || !mgrCloseJson.data.closedById) {
    throw new Error('Missing authoritative closedAt / closedById timestamps!');
  }
  console.log(`✓ Manager closed issue. Authoritative closedAt=${mgrCloseJson.data.closedAt}, closedBy=${mgrCloseJson.data.closedByName}`);

  // Closed issue cannot be modified -> 422 Unprocessable Entity
  const reopenRes = await fetch(`${baseUrl}/v1/issues/${issue.id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${managerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'IN_PROGRESS' }),
  });
  if (reopenRes.status === 422) {
    console.log('✓ Modifying closed issue properly rejected with HTTP 422 Unprocessable Entity.');
  } else {
    throw new Error(`Expected HTTP 422 on closed issue edit, got ${reopenRes.status}`);
  }

  // Attempting to attach file to closed issue -> 422 Unprocessable Entity
  const closedUploadRes = await fetch(`${baseUrl}/v1/issues/${issue.id}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: formData,
  });
  if (closedUploadRes.status === 422) {
    console.log('✓ Uploading file to closed issue properly rejected with HTTP 422 Unprocessable Entity.');
  } else {
    throw new Error(`Expected HTTP 422 on closed issue attachment upload, got ${closedUploadRes.status}`);
  }

  // 9. Comments thread & Audit discussion
  console.log('\n[8] Testing Comments Thread & Detail Retrieval...');
  const addCommentRes = await fetch(`${baseUrl}/v1/issues/${issue.id}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${managerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: 'Spare gaskets inventory replenished from vendor.' }),
  });
  if (addCommentRes.status !== 201) {
    throw new Error(`Failed to add comment: ${addCommentRes.status}`);
  }

  // Detail query
  const detailRes = await fetch(`${baseUrl}/v1/issues/${issue.id}`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const detailJson = await detailRes.json();
  const comments = detailJson.data.comments;
  console.log(`✓ Retrieved issue detail with ${comments.length} comments in audit trail:`);
  comments.forEach(c => {
    const flag = c.systemGenerated ? '[SYSTEM]' : '[USER]';
    console.log(`   ${flag} ${c.authorName} (${c.authorRole}): "${c.message}"`);
  });

  console.log('\n==================================================');
  console.log('  ALL PHASE 6 LIVE E2E VERIFICATIONS PASSED 100%!');
  console.log('==================================================');
}

run().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
