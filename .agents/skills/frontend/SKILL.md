---
name: frontend
description: React + Vite SPA development for the seat-booking web app
---

# frontend

Instructions for implementing or modifying the React + Vite SPA frontend in the seat-booking monorepo.

## Usage

Use this skill when creating or modifying the web app (`apps/web/`) — pages, components, services, or styles.

## Steps

1. **Target app:** `apps/web/` — React 18 + Vite SPA. Runs on port 3000.

2. **Tech stack:**
   - React 18 with TypeScript (strict)
   - Vite 5 for dev server and build
   - React Router v6 for client-side routing
   - Clerk React SDK for authentication
   - Axios for API calls to api-gateway

3. **Project structure:**
   ```
   apps/web/
   ├── index.html
   ├── vite.config.ts
   ├── tsconfig.json
   └── src/
       ├── main.tsx                 # ReactDOM.createRoot, ClerkProvider
       ├── App.tsx                  # React Router routes
       ├── pages/
       │   ├── HomePage.tsx         # Seat map — 3 seats
       │   ├── SeatPage.tsx         # /seats/:id — reserve + pay flow
       │   └── OrdersPage.tsx       # /orders — my bookings
       ├── components/
       │   ├── SeatMap/
       │   │   └── index.tsx        # 3 seat cards, status-aware
       │   └── SeatCard/
       │       └── index.tsx
       └── services/
           └── api.service.ts       # Typed axios calls to api-gateway
   ```

4. **Auth pattern:**
   - Wrap app in `<ClerkProvider>` with `VITE_CLERK_PUBLISHABLE_KEY`
   - Use `<SignedIn>` / `<SignedOut>` / `<RedirectToSignIn>` for route protection
   - Clerk handles JWT lifecycle — attach Bearer token to API requests
   - Session expiry: 90 days (configured in Clerk Dashboard)

5. **API calls:**
   - All requests go through api-gateway (`localhost:3001`)
   - Use typed axios service (`api.service.ts`)
   - Attach Clerk JWT as Bearer token in Authorization header

6. **Coding style:**
   - Tabs for indentation, 4-space tab width
   - Single quotes in all `.ts` / `.tsx` files
   - Named exports preferred over default exports
   - Functional components with hooks (no class components)

7. **Verification:**
   ```bash
   npm run lint   # must pass
   npm run build  # must pass
