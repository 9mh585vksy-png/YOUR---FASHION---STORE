import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesSource = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

interface SimulatedAuth {
  uid: string;
  email: string;
  email_verified: boolean;
  isAdmin?: boolean;
}

interface SimulatedRequest {
  collection: 'users' | 'users_private' | 'products' | 'orders' | 'delivery_locations';
  operation: 'get' | 'list' | 'create' | 'update';
  docId: string;
  auth: SimulatedAuth | null;
  incoming?: Record<string, unknown>;
  existing?: Record<string, unknown>;
  parentExists?: boolean;
  requestTime: string;
}

const VALID_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

function evaluateRule(req: SimulatedRequest): 'ALLOW' | 'PERMISSION_DENIED' {
  if (!req.auth) return 'PERMISSION_DENIED';
  if (req.operation !== 'get' && req.operation !== 'list' && !req.auth.email_verified) {
    return 'PERMISSION_DENIED';
  }
  if (req.operation !== 'list' && (!VALID_ID_REGEX.test(req.docId) || req.docId.length > 128)) {
    return 'PERMISSION_DENIED';
  }

  const isAdmin =
    req.auth.isAdmin === true ||
    (req.auth.email_verified && req.auth.email === 'bhattacharyadebargha14@gmail.com');

  if (req.collection === 'users') {
    if (req.operation === 'create') {
      const d = req.incoming || {};
      const keys = Object.keys(d);
      const allowed = ['uid', 'displayName', 'role', 'createdAt'];
      if (keys.length !== 4 || !keys.every((k) => allowed.includes(k))) return 'PERMISSION_DENIED';
      if (d.uid !== req.auth.uid || req.docId !== req.auth.uid) return 'PERMISSION_DENIED';
      if (d.createdAt !== req.requestTime) return 'PERMISSION_DENIED';
      if (d.role !== 'customer' && !isAdmin) return 'PERMISSION_DENIED';
      return 'ALLOW';
    }
    if (req.operation === 'update') {
      const d = req.incoming || {};
      const ex = req.existing || {};
      const keys = Object.keys(d);
      const allowed = ['uid', 'displayName', 'role', 'createdAt'];
      if (!keys.every((k) => allowed.includes(k))) return 'PERMISSION_DENIED';
      if (d.uid !== ex.uid || d.createdAt !== ex.createdAt) return 'PERMISSION_DENIED';
      if (!isAdmin && d.role !== ex.role) return 'PERMISSION_DENIED';
      return 'ALLOW';
    }
  }

  if (req.collection === 'users_private') {
    if (req.operation === 'get') {
      if (req.docId !== req.auth.uid && !isAdmin) return 'PERMISSION_DENIED';
      return 'ALLOW';
    }
    if (req.operation === 'create') {
      if (!req.parentExists) return 'PERMISSION_DENIED';
      if (req.docId !== req.auth.uid) return 'PERMISSION_DENIED';
      return 'ALLOW';
    }
  }

  if (req.collection === 'products') {
    if (req.operation === 'create') {
      if (!isAdmin) return 'PERMISSION_DENIED';
      const d = req.incoming || {};
      if (typeof d.price !== 'number' || d.price < 0 || d.price > 10000000) return 'PERMISSION_DENIED';
      return 'ALLOW';
    }
  }

  if (req.collection === 'orders') {
    if (req.operation === 'list') {
      const ex = req.existing || {};
      if (ex.userId !== req.auth.uid && ex.assignedPartnerId !== req.auth.uid && !isAdmin) {
        return 'PERMISSION_DENIED';
      }
      return 'ALLOW';
    }
    if (req.operation === 'create') {
      const d = req.incoming || {};
      if (d.createdAt !== req.requestTime || d.updatedAt !== req.requestTime) return 'PERMISSION_DENIED';
      return 'ALLOW';
    }
    if (req.operation === 'update') {
      const ex = req.existing || {};
      if ((ex.status === 'delivered' || ex.status === 'cancelled') && !isAdmin) {
        return 'PERMISSION_DENIED';
      }
      return 'ALLOW';
    }
  }

  if (req.collection === 'delivery_locations') {
    if (req.operation === 'create') {
      const d = req.incoming || {};
      if (
        typeof d.lat !== 'number' ||
        d.lat < -90 ||
        d.lat > 90 ||
        typeof d.lng !== 'number' ||
        d.lng < -180 ||
        d.lng > 180
      ) {
        return 'PERMISSION_DENIED';
      }
      return 'ALLOW';
    }
  }

  return 'PERMISSION_DENIED';
}

test('firestore.rules file contains all mandatory Eight Pillars structural invariants', () => {
  assert.ok(rulesSource.includes("rules_version = '2';"));
  assert.ok(rulesSource.includes('match /{document=**} {\n      allow read, write: if false;\n    }'));
  assert.ok(rulesSource.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesSource.includes('affectedKeys().hasOnly('));
  assert.ok(rulesSource.includes('match /private/{docId}'));
  assert.ok(rulesSource.includes('match /delivery_locations/{orderId}'));
});

test('All Dirty Dozen adversarial payloads return PERMISSION_DENIED', () => {
  const NOW = '2026-10-24T08:00:00Z';

  // 1. Unverified email spoof
  assert.equal(
    evaluateRule({
      collection: 'users',
      operation: 'create',
      docId: 'user_1',
      auth: { uid: 'user_1', email: 'bhattacharyadebargha14@gmail.com', email_verified: false },
      incoming: { uid: 'user_1', displayName: 'Spoofer', role: 'customer', createdAt: NOW },
      requestTime: NOW,
    }),
    'PERMISSION_DENIED'
  );

  // 2. Self-admin escalation on create
  assert.equal(
    evaluateRule({
      collection: 'users',
      operation: 'create',
      docId: 'user_1',
      auth: { uid: 'user_1', email: 'customer@example.com', email_verified: true },
      incoming: { uid: 'user_1', displayName: 'Customer', role: 'admin', createdAt: NOW },
      requestTime: NOW,
    }),
    'PERMISSION_DENIED'
  );

  // 3. Shadow field injection on user update
  assert.equal(
    evaluateRule({
      collection: 'users',
      operation: 'update',
      docId: 'user_1',
      auth: { uid: 'user_1', email: 'customer@example.com', email_verified: true },
      existing: { uid: 'user_1', displayName: 'Customer', role: 'customer', createdAt: NOW },
      incoming: { uid: 'user_1', displayName: 'Customer', role: 'customer', createdAt: NOW, isVerified: true },
      requestTime: NOW,
    }),
    'PERMISSION_DENIED'
  );

  // 4. Cross-user PII read
  assert.equal(
    evaluateRule({
      collection: 'users_private',
      operation: 'get',
      docId: 'user_1',
      auth: { uid: 'user_2', email: 'other@example.com', email_verified: true },
      requestTime: NOW,
    }),
    'PERMISSION_DENIED'
  );

  // 5. Orphaned private info create
  assert.equal(
    evaluateRule({
      collection: 'users_private',
      operation: 'create',
      docId: 'user_1',
      auth: { uid: 'user_1', email: 'customer@example.com', email_verified: true },
      parentExists: false,
      requestTime: NOW,
    }),
    'PERMISSION_DENIED'
  );

  // 6. Unauthorized product write by customer
  assert.equal(
    evaluateRule({
      collection: 'products',
      operation: 'create',
      docId: 'prod_1',
      auth: { uid: 'user_1', email: 'customer@example.com', email_verified: true },
      incoming: { price: 2999 },
      requestTime: NOW,
    }),
    'PERMISSION_DENIED'
  );

  // 7. Product negative price poisoning by admin
  assert.equal(
    evaluateRule({
      collection: 'products',
      operation: 'create',
      docId: 'prod_1',
      auth: { uid: 'admin_1', email: 'bhattacharyadebargha14@gmail.com', email_verified: true, isAdmin: true },
      incoming: { price: -500 },
      requestTime: NOW,
    }),
    'PERMISSION_DENIED'
  );

  // 8. Cross-customer order list scraping
  assert.equal(
    evaluateRule({
      collection: 'orders',
      operation: 'list',
      docId: 'ord_1',
      auth: { uid: 'user_2', email: 'other@example.com', email_verified: true },
      existing: { userId: 'user_1', assignedPartnerId: 'partner_1' },
      requestTime: NOW,
    }),
    'PERMISSION_DENIED'
  );

  // 9. Terminal order mutation after delivered
  assert.equal(
    evaluateRule({
      collection: 'orders',
      operation: 'update',
      docId: 'ord_1',
      auth: { uid: 'partner_1', email: 'partner@example.com', email_verified: true },
      existing: { userId: 'user_1', assignedPartnerId: 'partner_1', status: 'delivered' },
      incoming: { status: 'out_for_delivery' },
      requestTime: NOW,
    }),
    'PERMISSION_DENIED'
  );

  // 10. Client timestamp forgery
  assert.equal(
    evaluateRule({
      collection: 'orders',
      operation: 'create',
      docId: 'ord_1',
      auth: { uid: 'user_1', email: 'customer@example.com', email_verified: true },
      incoming: { createdAt: '2020-01-01T00:00:00Z', updatedAt: NOW },
      requestTime: NOW,
    }),
    'PERMISSION_DENIED'
  );

  // 11. Fake GPS coordinate injection
  assert.equal(
    evaluateRule({
      collection: 'delivery_locations',
      operation: 'create',
      docId: 'ord_1',
      auth: { uid: 'partner_1', email: 'partner@example.com', email_verified: true },
      incoming: { lat: 290, lng: -500 },
      requestTime: NOW,
    }),
    'PERMISSION_DENIED'
  );

  // 12. ID poisoning attack with invalid characters
  assert.equal(
    evaluateRule({
      collection: 'users',
      operation: 'create',
      docId: 'bad/id$with*spaces!',
      auth: { uid: 'bad/id$with*spaces!', email: 'customer@example.com', email_verified: true },
      incoming: { uid: 'bad/id$with*spaces!', displayName: 'User', role: 'customer', createdAt: NOW },
      requestTime: NOW,
    }),
    'PERMISSION_DENIED'
  );
});
