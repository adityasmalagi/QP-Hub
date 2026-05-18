## Problem
On mobile, opening the hamburger menu shows a translucent glass sheet (`bg-white/10` over the page), making the menu items blend into the background and hard to read.

## Fix
In `src/components/Navbar.tsx`, update the `SheetContent` styling so the mobile menu remains glassy but has enough opacity and contrast to read clearly:

- Replace `bg-white/10 dark:bg-white/5` with a stronger, theme-aware surface like `bg-background/90 dark:bg-background/80` while keeping `backdrop-blur-2xl backdrop-saturate-150` for the iOS feel.
- Strengthen the border to `border-border/60` so the panel edge is visible in both themes.
- Ensure nav links inside the sheet use `text-foreground` (active) and `text-muted-foreground` (idle) so they read on the new surface in both light and dark mode.

No other components or logic change.
