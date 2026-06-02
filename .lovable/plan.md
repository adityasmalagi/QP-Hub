Plan:

1. Update `src/components/Navbar.tsx`
   - Remove the full-width `navbar-glass-veil` layer that creates the visible same-color strip behind the navbar.
   - Keep the navbar container itself transparent and overlay-style, so only the logo/nav pills are glass surfaces.
   - Use `overflow-visible` instead of clipping, so pill shadow/blur looks natural.

2. Refine the glass pill styling in `src/index.css`
   - Move the blur, gradient, border, and soft shadow effect onto `.navbar-glass-pill` only.
   - Add a subtle animated gradient shimmer inside the pills, not across the whole page width.
   - Keep the effect theme-aware using the existing HSL design tokens.

3. Adjust the homepage top spacing in `src/pages/Index.tsx`
   - Let the hero background begin directly from the top of the viewport behind the navbar.
   - Increase the hero content top padding slightly so the headline does not collide with the floating navbar.
   - This removes the separate band/space while keeping the layout visually balanced.

4. Verify responsive alignment
   - Check desktop and mobile navbar spacing so logo, nav links, theme toggle, hamburger/account controls remain aligned.
   - Ensure the mobile slide-down menu keeps the same glass pill style without reintroducing a full-width background strip.