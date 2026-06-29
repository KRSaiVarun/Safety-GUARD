---
name: SafetyGUARD nav architecture
description: Navigation structure, new pages, and layout patterns.
---

## Navbar
Single Navbar component renders for ALL routes except /emergency.
- No user: shows logo only + Sign In button (hidden on /login)
- User (non-admin): Home, SOS, History, Contacts, Profile, Settings, Logout
- Admin: Home, Dashboard, Users, Analytics, Live, Sessions, AI Monitor, Settings, Logout
- Mobile <900px: hamburger drawer

## Pages structure
User pages: /dashboard (UserHomePage), /emergency, /history, /contacts, /profile, /settings, /replay/:id
Admin pages: /admin/home, /admin/dashboard (DashboardPage), /admin/users, /admin/analytics, /admin/live, /admin/sessions, /admin/ai, /admin/settings

## Top padding convention
All pages need min 68-80px top padding to clear the fixed 60px Navbar.
- UserHomePage: 80px ✓
- DashboardPage: 130px (accounts for Navbar + TopStatusBar which renders inline)
- New user pages (History, Contacts, Settings): 80px
- New admin pages: 80px

## CSS theme variables
--red, --green, --cyan, --blue, --text-0/1/2/3, --border, --surface, --radius-md
Cards: rgba(255,255,255,0.03) bg + 1px solid var(--border) + border-radius 12px
