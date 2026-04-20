# OtoNav Admin Panel

Next.js 15 administration console for OtoNav.

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Zustand** — auth state
- **Axios** — API client
- **Recharts** — analytics charts
- **date-fns** — date formatting
- **DM Serif Display + DM Sans + DM Mono** — typography

## Setup

```bash
cp .env.example .env.local
# set NEXT_PUBLIC_API_URL to your Express backend

npm install
npm run dev
```

## Routes

| Path | Description |
|------|-------------|
| `/login` | Admin login |
| `/dashboard` | Overview stats + recent orders |
| `/dashboard/users` | All users, filterable by role/search |
| `/dashboard/users/[userId]` | User detail + org memberships |
| `/dashboard/organizations` | All orgs with member counts |
| `/dashboard/organizations/[orgId]` | Org detail + member table |
| `/dashboard/orders` | All orders, filterable by status |
| `/dashboard/orders/[orderId]` | Order detail with customer/rider/org |
| `/dashboard/verified-riders` | Verified riders + create/remove |
| `/dashboard/waitlist` | Verified rider waitlist |
| `/dashboard/analytics` | Order charts + rider performance table |

## Auth

Token stored in `admin_token` cookie (1 day expiry). Auto-redirects to `/login` on 401.
All dashboard routes are client-side guarded via the auth store.
