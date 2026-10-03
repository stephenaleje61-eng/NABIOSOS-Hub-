# Security Specification & Test-Driven Security Plan

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be created or modified by `request.auth.uid == userId`. Users cannot impersonate other students.
2. **Friend Request Integrity**: A friend request must have `senderId == request.auth.uid`, cannot be sent to oneself, and only the recipient (`receiverId`) can update status to 'accepted' or 'declined'.
3. **Friendship Invariant**: Friendships can only be created upon mutually accepted friend requests and users array must contain exactly 2 valid user IDs including the caller.
4. **Private Chat Confidentiality**: Only participants listed in `participants` can read, query, or send messages into `/privateChats/{chatId}/messages`.
5. **Space Message Ownership**: Messages in `/spaces/{spaceId}/messages` must originate from `senderId == request.auth.uid`. A student cannot author a post using someone else's identity.
6. **Market Item Integrity**: Market items can only be created by `sellerId == request.auth.uid`, and only the seller can edit status or delete the listing.
7. **Announcement Protection**: Only authenticated student association executives/members can publish announcements, with valid author identity verification.
8. **Anti-Tampering & Size Invariants**: All string lengths, document keys, and required parameters are bounded to prevent Denial of Wallet and storage bloat attacks.

## 2. The "Dirty Dozen" Payloads (Attacks That Must Be Denied)
1. **Spoofed User Creation**: Creating `/users/victim_123` with `request.auth.uid == "attacker_999"`.
2. **Shadow Field Injection**: Injecting `"isAdmin": true` or `"systemRole": "superadmin"` into `/users/{userId}`.
3. **Friend Request Impersonation**: Submitting a friend request where `senderId` is `"victim_456"` instead of caller UID.
4. **Self Friend Request Poisoning**: Sending a friend request where `senderId == receiverId`.
5. **Unauthorized Acceptance**: Attacker updating a friend request where `receiverId == "victim_789"` to `"accepted"`.
6. **Private Chat Eavesdropping**: Non-participant querying `/privateChats/chat_abc/messages`.
7. **Private Message Forgery**: Inserting a message into `/privateChats/{chatId}/messages` with `senderId` of the counterparty.
8. **Space Message Identity Theft**: Creating a post in `/spaces/microbiology-100/messages` with someone else's `senderId`.
9. **Market Price Tampering**: Non-seller modifying another student's marketplace listing.
10. **Market Payload Inflation**: Attempting to post a 5MB payload in a market item description.
11. **Announcement Deletion Attack**: Non-author trying to delete an executive announcement.
12. **Unauthenticated Access**: Any write operation performed by an unauthenticated request (`request.auth == null`).

## 3. Test Runner Specification
All tests ensure `PERMISSION_DENIED` is triggered whenever any of the Dirty Dozen rules are breached.
