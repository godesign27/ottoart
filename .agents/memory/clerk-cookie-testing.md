---
name: Clerk development cookie tests
description: Why a valid backend-issued Clerk token can fail cookie-authenticated API tests before application middleware
---

Cookie-authenticated Clerk development API tests need consistent browser metadata as well as a valid signed session token.

**Why:** The development SDK checks browser-presence and client-activity cookies before reaching application authorization. An absent marker or a client-activity time newer than the token's issuance can produce a 401 even when the session token is valid.

**How to apply:** Prefer the programmatic browser tester when available. For backend integration tests, emulate the development browser metadata consistently with the issued session; never change application authentication to bearer tokens or weaken verification to make a test pass.
