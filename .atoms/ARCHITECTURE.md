---
last_updated: 2026-07-15T22:16:31Z
---

# Architecture Design

## System Overview
DishBar is a full-stack marketplace web application connecting Persian home chefs with customers in Ontario. It uses a React frontend with Atoms Cloud backend (FastAPI + PostgreSQL). The platform supports trilingual content (EN/FR/FA with RTL), Stripe payments with commission splits, and role-based portals for customers, chefs, and admins.

## Tech Stack
- Frontend: React 18, TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query
- Backend: FastAPI (Python), SQLAlchemy async, PostgreSQL, Atoms Cloud
- Payments: Stripe Checkout Sessions with platform commission
- Auth: Atoms Cloud auth (email/social login)
- Hosting: Atoms Cloud (frontend + backend)

## Module Design
| Module | Responsibility | Key Files |
|--------|---------------|-----------|
| Public API | Unauthenticated browsing of chefs/menu/reviews | backend/routers/public.py |
| Chefs CRUD | Chef profile management (authenticated) | backend/routers/chefs.py, models/chefs.py |
| Menu Items CRUD | Menu item management (authenticated) | backend/routers/menu_items.py, models/menu_items.py |
| Orders CRUD | Order lifecycle management | backend/routers/orders.py, models/orders.py |
| Reviews CRUD | Customer reviews | backend/routers/reviews.py, models/reviews.py |
| Payments | Stripe checkout + verification | backend/routers/payments.py |
| Homepage | Landing page with chefs/menu browsing | frontend/src/pages/Index.tsx |
| Chef Profile | Chef detail + menu + ordering | frontend/src/pages/ChefProfile.tsx |
| Checkout | Cart + payment flow | frontend/src/pages/Checkout.tsx |
| Chef Dashboard | Chef portal for profile/menu/orders | frontend/src/pages/ChefDashboard.tsx |
| i18n + Cart | Translations + cart state | frontend/src/lib/api.ts |

## Tech Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Public API | Separate unauthenticated router | Allows browsing without login, better SEO |
| Stripe Checkout | Server-side session creation | Secure payment flow, PCI compliant |
| Commission model | 15% platform fee | Standard marketplace rate |
| i18n approach | Client-side translation map | Simple, no external deps, supports RTL |
| Cart storage | localStorage | Works without auth, persists across sessions |
| Currency | CAD | Ontario, Canada target market |

## File Tree Plan
```
app/
├── backend/
│   ├── core/config.py, database.py
│   ├── models/chefs.py, menu_items.py, orders.py, reviews.py
│   ├── routers/public.py, chefs.py, menu_items.py, orders.py, reviews.py, payments.py
│   └── services/, dependencies/, schemas/
├── frontend/
│   ├── src/
│   │   ├── lib/api.ts (i18n, cart, API client)
│   │   ├── pages/Index.tsx, ChefProfile.tsx, Checkout.tsx, OrderSuccess.tsx, ChefDashboard.tsx
│   │   ├── components/ui/ (shadcn components)
│   │   └── App.tsx (routing)
│   └── public/
```

## Implementation Guide
1. Backend auto-discovers routers from `routers/` package
2. Public endpoints at `/api/v1/public/*` require no auth
3. Entity CRUD at `/api/v1/entities/*` requires auth via Atoms Cloud
4. Payment flow: Frontend → create_payment_session → Stripe redirect → verify_payment
5. Chef approval: Chefs register via dashboard, admin approves (is_approved flag)
6. Menu items linked to chef_id, shown only when chef is approved+active

