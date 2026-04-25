## Plan: Add polished animations to the homepage

### What will change
- Add more motion to the home page without changing the layout or breaking existing functionality.
- Keep animations lightweight and consistent with the current purple/lavender design.
- Make the page feel more interactive on first load, scroll, and hover.

### Homepage animation updates
1. **Hero section**
   - Add floating decorative orbs/blur shapes in the background.
   - Add a gentle floating animation to the logo/hero badge area.
   - Add subtle hover lift/scale to the main Browse Papers and Upload Paper buttons.

2. **Paper cards and section cards**
   - Add staggered fade/scale entry animations where cards appear.
   - Add smoother hover effects for cards: slight lift, glow, and scale.
   - Keep existing click behavior intact, including redirecting logged-out users to login.

3. **How to Find Papers / Upload sections**
   - Animate step cards as they enter the viewport.
   - Add small icon/number hover motion to make each step feel clickable and lively.

4. **Global animation utilities**
   - Reuse existing Tailwind animations where possible.
   - Add only a few reusable utilities if needed, such as slow float, shimmer, and hover-lift.
   - Respect the existing theme tokens and avoid hardcoded component colors.

### Technical details
- Update `src/pages/Index.tsx` for homepage animation classes and section wrappers.
- Update `src/index.css` and/or `tailwind.config.ts` only if additional reusable animations are needed.
- No backend or database changes are required.
- Run a production build after changes to confirm everything compiles.