# Security Specification - LAKONAN AI

## 1. Data Invariants
- Users can only read and write their own profile document (`/users/{userId}` where `userId == request.auth.uid`), except administrators who can read and manage user roles.
- Standard users cannot modify or escalate their own `role` field.
- Users can only read, create, update, or delete their own AI consultation sessions (`/aiSessions/{sessionId}` where `resource.data.userId == request.auth.uid`).
- Subcollection messages (`/aiSessions/{sessionId}/messages/{messageId}`) strictly inherit permissions from the parent `aiSessions/{sessionId}` document via `get(/databases/$(database)/documents/aiSessions/$(sessionId))`.
- Human consultations (`/consultations/{consultationId}`):
  - Created by an authenticated user where `request.resource.data.userId == request.auth.uid`.
  - Read by the author user, the assigned consultant (`resource.data.consultantId == request.auth.uid`), or any consultant when status is `waiting` or `assigned`, and admins.
  - Users can update their own consultation message/subject if status is `waiting`.
  - Consultants can accept/assign themselves and write answers/update status.
  - Admins can manage all consultations.
- System admin is identified by email `encikabdulhajar@gmail.com` with `email_verified == true` or role == 'admin' in their user document.

## 2. The Dirty Dozen Payloads (Rejection Matrix)
1. **Unauthenticated User Profile Read**: Anonymous/unauth access to `/users/{userId}` -> DENIED
2. **Identity Spoofing on User Registration**: Setting `uid: "attacker"` while authenticated as `"victim"` -> DENIED
3. **Privilege Escalation**: User updating their own document with `role: "admin"` -> DENIED
4. **Foreign AI Session Snoop**: User A querying or reading User B's `/aiSessions/{sessionId}` -> DENIED
5. **Orphan Message Injection**: Adding a message to `/aiSessions/{sessionId}/messages` without owning the parent session -> DENIED
6. **Consultation Hijack**: Non-consultant / non-admin updating response or assigning someone else -> DENIED
7. **Foreign Consultation Read**: User A listing consultations belonging to User B -> DENIED
8. **Malicious Giant Payload**: Writing 1MB strings into title or ID parameters -> DENIED
9. **Fake Email Verified Admin**: Accessing admin capabilities with spoofed unverified email -> DENIED
10. **Terminal State Tampering**: Changing a closed consultation back to waiting by a non-admin -> DENIED
11. **Shadow Key Injection**: Injecting unexpected properties `isVIP: true` into session -> DENIED
12. **ID Poisoning Attack**: Passing oversized document ID with special punctuation -> DENIED
