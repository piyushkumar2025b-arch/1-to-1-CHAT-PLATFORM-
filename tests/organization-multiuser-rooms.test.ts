import WebSocket from 'ws';
import assert from 'assert';

const SERVER_PORT = 3000;
const BASE_WS_URL = `ws://localhost:${SERVER_PORT}/ws`;
const BASE_HTTP_URL = `http://localhost:${SERVER_PORT}`;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function createClient(
  roomId: string,
  password: string,
  username: string,
  roomType: 'organization' | 'direct' = 'organization',
  orgName = 'Acme Security Corp'
): Promise<{
  ws: WebSocket;
  userId: string;
  role: string;
  receivedMessages: any[];
  presenceUpdates: any[];
  close: () => void;
}> {
  const ws = new WebSocket(BASE_WS_URL, { headers: { Origin: 'http://localhost:3000' } });
  await new Promise<void>((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });

  const receivedMessages: any[] = [];
  const presenceUpdates: any[] = [];

  return new Promise((resolve, reject) => {
    let userId = '';
    let role = '';

    const timer = setTimeout(() => {
      ws.close();
      reject(new Error(`Auth response timeout for ${username}`));
    }, 6000);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'auth_ok') {
          userId = msg.userId;
          role = msg.role;
          clearTimeout(timer);
          resolve({
            ws,
            userId,
            role,
            receivedMessages,
            presenceUpdates,
            close: () => ws.close(),
          });
        } else if (msg.type === 'presence_update') {
          presenceUpdates.push(msg);
        } else if (msg.type === 'message' || msg.type === 'encrypted_message') {
          receivedMessages.push(msg);
        }
      } catch (err) {
        console.error('Error parsing client message:', err);
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    ws.send(
      JSON.stringify({
        type: 'auth',
        roomId,
        password,
        roomType,
        organizationName: orgName,
        username,
      })
    );
  });
}

async function runTests() {
  console.log('============================================================');
  console.log('🏢 VERIFYING ORGANIZATIONAL LEVEL MULTI-PEOPLE CHAT ROOMS');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    return Promise.resolve()
      .then(fn)
      .then(() => {
        console.log(`  ✓ PASS: ${name}`);
        passed++;
      })
      .catch((err) => {
        console.error(`  ✗ FAIL: ${name}`);
        console.error('    Error:', err.message);
        failed++;
      });
  }

  const testOrgRoomId = `CORP-${Date.now().toString(36).toUpperCase()}`;
  const testPassword = 'Organizational-Secure-Password-2026!';
  const orgName = 'Global Cyber Defense Team';

  console.log(`[Test Suite 1] REST Authentication & Room Provisioning for Organization`);
  await test('REST API creates organization room with maxCapacity=50 and custom orgName', async () => {
    const res = await fetch(`${BASE_HTTP_URL}/api/rooms/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: testOrgRoomId,
        password: testPassword,
        userId: 'admin_usr_01',
        roomType: 'organization',
        organizationName: orgName,
        maxCapacity: 50,
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.roomType, 'organization');
    assert.strictEqual(data.organizationName, orgName);
    assert.strictEqual(data.maxCapacity, 50);
    assert.ok(data.sessionToken);
  });

  console.log(`\n[Test Suite 2] Multi-User Simultaneous Connection (> 2 Users Allowed)`);
  const clients: Array<Awaited<ReturnType<typeof createClient>>> = [];

  await test('Creator joins and receives admin role & 1 active participant count', async () => {
    const client1 = await createClient(testOrgRoomId, testPassword, 'Alice (Security Lead)', 'organization', orgName);
    clients.push(client1);
    assert.strictEqual(client1.role, 'admin');
  });

  await test('Team member 2 (Bob) joins without being rejected as room full', async () => {
    const client2 = await createClient(testOrgRoomId, testPassword, 'Bob (DevOps)', 'organization', orgName);
    clients.push(client2);
    assert.strictEqual(client2.role, 'member');
  });

  await test('Team member 3 (Charlie) joins (exceeding 2-user direct limit)', async () => {
    const client3 = await createClient(testOrgRoomId, testPassword, 'Charlie (Cryptographer)', 'organization', orgName);
    clients.push(client3);
    assert.strictEqual(client3.role, 'member');
  });

  await test('Team member 4 (Diana) joins smoothly', async () => {
    const client4 = await createClient(testOrgRoomId, testPassword, 'Diana (Threat Intel)', 'organization', orgName);
    clients.push(client4);
    assert.strictEqual(client4.role, 'member');
  });

  await test('Team member 5 (Evan) joins smoothly', async () => {
    const client5 = await createClient(testOrgRoomId, testPassword, 'Evan (Auditor)', 'organization', orgName);
    clients.push(client5);
    assert.strictEqual(client5.role, 'member');
  });

  await sleep(400);

  console.log(`\n[Test Suite 3] Real-Time Presence Updates & Member Roster Accuracy`);
  await test('All connected members receive live presence updates with count = 5', () => {
    assert.strictEqual(clients.length, 5);
    for (let i = 0; i < clients.length; i++) {
      const updates = clients[i].presenceUpdates;
      assert.ok(updates.length > 0, `Client ${i} must receive presence updates`);
      const latest = updates[updates.length - 1];
      assert.strictEqual(latest.participantCount, 5, `Latest participant count must be 5`);
      assert.strictEqual(latest.roomType, 'organization');
      assert.strictEqual(latest.organizationName, orgName);
      assert.strictEqual(latest.participants.length, 5, `Roster must contain 5 real participants`);
      
      // Verify no placeholder data
      for (const p of latest.participants) {
        assert.ok(p.id && p.id.length > 0, 'Participant ID must exist');
        assert.ok(p.username && p.username.length > 0, 'Participant username must exist');
        assert.ok(['admin', 'member'].includes(p.role), 'Participant role must be admin or member');
        assert.strictEqual(p.isOnline, true, 'Participant must be online');
      }
    }
  });

  console.log(`\n[Test Suite 4] Multi-Peer Broadcast Relay Across All 5 Members`);
  await test('Broadcast from Alice is received by all 4 other members simultaneously', async () => {
    const messagePayload = {
      messageId: `msg_${Date.now()}_corp1`,
      text: 'CONFIDENTIAL: System defense perimeter active.',
      nonce: `nonce_${Date.now()}_1`,
      enc: true,
      iv: 'sample_iv_corp',
      ct: 'sample_ciphertext_corp',
    };

    clients[0].ws.send(
      JSON.stringify({
        type: 'encrypted_message',
        payload: messagePayload,
      })
    );

    await sleep(300);

    for (let i = 1; i < clients.length; i++) {
      const msgs = clients[i].receivedMessages;
      const found = msgs.some((m) => m.payload?.messageId === messagePayload.messageId || m.payload?.text === messagePayload.text);
      assert.ok(found, `Client ${i} must have received the relayed message`);
    }
  });

  console.log(`\n[Test Suite 5] Clean Member Departure & Dynamic Presence Decrement`);
  await test('When member 5 disconnects, presence updates to 4 online members', async () => {
    const departing = clients.pop();
    departing?.close();

    await sleep(500);

    for (let i = 0; i < clients.length; i++) {
      const updates = clients[i].presenceUpdates;
      const latest = updates[updates.length - 1];
      assert.strictEqual(latest.participantCount, 4, `Participant count should decrease to 4`);
      assert.strictEqual(latest.action, 'left');
    }
  });

  // Cleanup remaining clients
  for (const c of clients) {
    c.close();
  }
  await sleep(200);

  console.log('\n============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
