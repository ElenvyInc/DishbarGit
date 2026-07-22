---
last_updated: 2026-07-15T22:16:31Z
status: active
---

# Project Context

## Project Overview
DishBar is a production-ready trilingual (English, French, Persian/RTL) marketplace platform connecting home chefs specializing in Persian/Iranian cuisine with customers in Ontario, Canada. Three portals: Customer, Chef, and Admin. Payments via Stripe Connect with commission splits. Design: Modern, Minimal, Premium, Clean. Mobile-first responsive web app with PWA support. Target: Iranian community in Ontario, scalable to 1M users.

## Key Decisions
| Date | Decision | By | Rationale |
|------|----------|-----|-----------|
| 2026-07-15 | Phone/SMS OTP authentication | User | Simplifies onboarding for community users |
| 2026-07-15 | Stripe Connect for payments | User | Native marketplace splits, KYC, tips, refunds |
| 2026-07-15 | Trilingual EN/FR/FA with RTL | User | Serves Iranian community + Canadian bilingual requirements |
| 2026-07-15 | Modern/Minimal/Premium design | User | Updated design direction — clean, inspired by premium platforms |
| 2026-07-15 | Three portals: Customer, Chef, Admin | User | Clear separation of concerns for different user roles |
| 2026-07-15 | Flexible delivery: pickup, self, third-party | User | Chef autonomy, reduces platform liability |

## Constraints
- Ontario home food regulations (Regulation 493/17)
- PIPEDA/CASL compliance for Canadian users
- Full RTL support for Persian/Farsi
- No mention of competitor brand names in platform copy
- Mobile-first responsive design
- PWA support required
- Scalable architecture (target 1M users)
- Accessibility compliant (WCAG 2.1 AA)


