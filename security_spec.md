# Firestore Security Specification — YOUR FASHION STORE

## 1. Data Invariants
1. **Default Deny & Verified Identity**: Every write requires an authenticated user with `request.auth.token.email_verified == true`.
2. **PII Split Collection Isolation**: `/users/{userId}` stores only non-PII public fields (`uid`, `displayName`, `role`, `createdAt`). All PII (`email`, `phone`, notification settings) lives exclusively in `/users/{userId}/private/{docId}`, readable and writable only by `userId` (verified against parent `/users/{userId}`) or an admin.
3. **Self-Role Escalation Prevention**: Users creating `/users/{userId}` can only set `role == 'customer'` unless they are a bootstrapped admin. Users cannot mutate `role`, `uid`, or `createdAt` during updates.
4. **Catalog Integrity**: Only verified admins (`isAdmin()`) can create, update, or delete `/products/{productId}`.
5. **Order Ownership & Terminal State Locking**: Orders in `/orders/{orderId}` can only be read/listed by `resource.data.userId == request.auth.uid`, `resource.data.assignedPartnerId == request.auth.uid`, or `isAdmin()`. Once an order reaches `'delivered'` or `'cancelled'`, non-admin updates are blocked.
6. **Authorized GPS Telemetry**: `/delivery_locations/{orderId}` requires that the parent `/orders/{orderId}` exists and that `partnerId == request.auth.uid` (or `isAdmin()`), with valid latitude (`-90 <= lat <= 90`) and longitude (`-180 <= lng <= 180`).

## 2. The "Dirty Dozen" Payloads
1. **Unverified Email Spoof**: Write to `/users/user_1` with `email_verified: false`. -> `PERMISSION_DENIED`
2. **Self-Admin Escalation on Create**: Create `/users/user_1` with `role: 'admin'` by non-admin. -> `PERMISSION_DENIED`
3. **Shadow Field Injection on User Update**: Update `/users/user_1` with extra key `isSuperUser: true`. -> `PERMISSION_DENIED`
4. **Cross-User PII Read**: Authenticated `user_2` attempts `get` on `/users/user_1/private/info`. -> `PERMISSION_DENIED`
5. **Orphaned Private Info Create**: Create `/users/user_1/private/info` when `/users/user_1` does not exist. -> `PERMISSION_DENIED`
6. **Unauthorized Product Write**: Customer attempts to create `/products/prod_1`. -> `PERMISSION_DENIED`
7. **Product Negative Price Poisoning**: Admin attempts to create `/products/prod_1` with `price: -500`. -> `PERMISSION_DENIED`
8. **Cross-Customer Order Scraping (`list`)**: `user_2` attempts unconstrained `list` on `/orders`. -> `PERMISSION_DENIED`
9. **Terminal Order Mutation**: Assigned partner attempts to update `/orders/ord_1` after `status == 'delivered'`. -> `PERMISSION_DENIED`
10. **Client Timestamp Forgery**: Create `/orders/ord_1` with forged past `createdAt` instead of `request.time`. -> `PERMISSION_DENIED`
11. **Fake GPS Coordinates Injection**: Delivery partner writes `lat: 290, lng: -500` to `/delivery_locations/ord_1`. -> `PERMISSION_DENIED`
12. **ID Poisoning Attack**: Create document with 500-char or regex-violating ID. -> `PERMISSION_DENIED`
