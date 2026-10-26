---
name: Dependency compatibility
description: Constraints when recovering dependency installs blocked by the package firewall
---

Keep dependency recovery within the application's current runtime and API major versions unless a migration is explicitly needed.

**Why:** Updating to the latest Cloud Storage major during setup recovery required Node 22 while this project runs Node 20; updating a parent alone also left a blocked transitive version locked.

**How to apply:** Check engine requirements before selecting updates. If a compatible parent update still resolves a blocked transitive dependency, use a narrowly scoped override to a patched, compatible version and verify a clean lockfile install and build. Do not bypass the package firewall.
