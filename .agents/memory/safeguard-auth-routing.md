---
name: SafetyGUARD auth & routing
description: Admin detection, demo mode, passcode flow, and route guard patterns.
---

## Admin detection
`isAdmin()` in authStore checks: `email === 'kr@gmail.com' OR role in ['admin','supervisor','operator']`.
`mapSupabaseUser()` in both authStore.ts AND App.tsx must set `role: 'admin'` when email === 'kr@gmail.com' to ensure LoginPage role check works.

**Why:** Supabase users may have `role: 'user'` in metadata even for the admin email; email check is the authoritative fallback.

## Demo mode
- VITE_DEMO_MODE=true bypasses Supabase
- Admin: kr@gmail.com / admin123, User: test@gmail.com / 123456
- Demo passcode hash = hashPin('1234'), auto-set on login

## Passcode flow
After setup, PasscodeSetupPage checks `isAdmin()` and routes admin → /admin/dashboard, user → /dashboard.

## Route guards
- AdminRoute: user + isAdmin() + hasPasscode() → else redirect to /login or /dashboard
- PasscodeProtectedRoute: user + hasPasscode() → else /login or /passcode-setup
- Navbar hides itself on /emergency (full-screen SOS). Shows for all other routes.
