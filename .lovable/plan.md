

## Plan: Keep Trending Papers Visible for All Users, Redirect to Login on Click

### What changes
The trending papers section on the homepage is already visible to all users (no auth check wraps it). The only change needed is in **PaperCard** — when an unauthenticated user clicks a paper card, redirect them to `/auth?redirect=/paper/{id}` instead of navigating directly to the paper detail page.

Additionally, **PaperDetail** page needs an auth gate so unauthenticated users who somehow reach it directly get redirected to login.

### Technical details

**File 1: `src/components/PaperCard.tsx`**
- Import `useAuth` hook
- In the component, get `user` from `useAuth()`
- Replace the `<Link to={/paper/${id}}>` wrapper with an `onClick` handler that:
  - If `user` exists → navigate to `/paper/${id}`
  - If no `user` → navigate to `/auth?redirect=/paper/${id}`

**File 2: `src/pages/PaperDetail.tsx`**
- Add an auth redirect check: if `!user && !loading`, redirect to `/auth?redirect=/paper/${id}`
- This ensures direct URL access is also protected

