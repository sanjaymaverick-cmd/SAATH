# SAATH rebrand build plan

- [x] Preserve the v1.2.9 baseline and existing workout functionality on the rebrand branch.
- [x] Establish the logo, PWA/native assets, and navy/orange/gold design system.
- [x] Add admin-managed login IDs, generated temporary passwords, forced password changes,
      session revocation, account disabling, and throttled password login.
- [x] Add 28-day adherence, weekly completion, missed-session, and streak calculations.
- [x] Complete core user-facing brand strings and deployment documentation.
- [x] Run API, frontend, production-build, and end-to-end authentication validation.
- [x] Add Docker Compose images (`saath-api:local`, `saath-web:local`) and Oracle deploy
      scripts under `deploy/` (`/opt/saath`, data-preserving rollout, nightly backups).
- [x] Connect Capacitor clients to the Oracle API (`VITE_MOBILE_SYNC=1`) and build the
      Android APK with Java 21.

## Still owner-confirmed

- [ ] Walk a family iPhone through: install → temp password → forced change → log a workout
      → see the session on another device and in Admin adherence.
