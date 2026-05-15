## Why Google is showing wrong branding

Three issues are making Google show stale/wrong branding for `qphub.lovable.app` instead of QP Hub:

1. **`public/favicon.ico` still exists** — browsers and Google request `/favicon.ico` by default and it overrides the `<link rel="icon" href="/qphub-logo.png">` declared in `index.html`. This is almost certainly the "Lovable logo" you see in the result.
2. **`og:image` points to an external `image2url.com` URL** — Google and social crawlers prefer images hosted on the same domain. We have `public/qphub-logo.png` already, so we should serve the OG image from `https://qphub.lovable.app/qphub-logo.png`.
3. **Duplicate `google-site-verification` meta tag** in `index.html` — there are two of them; the second one (`dlZt-...`) is stale and should be removed.

(Note: "Vercel" isn't actually appearing anywhere in the site — `vercel.json` is just an SPA rewrite config, it doesn't affect what Google shows. If you're literally seeing the word "Vercel" in the result, please share a screenshot — it may be cached from a previous deploy.)

## Changes

1. **Delete `public/favicon.ico`** so the QP Hub logo declared in `index.html` takes over as the favicon.
2. **Edit `index.html`**:
   - Replace `og:image` and `twitter:image` URLs with `https://qphub.lovable.app/qphub-logo.png`.
   - Remove the duplicate `<meta name="google-site-verification" content="dlZt-...">` line, keeping only the active one.
3. **Publish** the site so the new meta + favicon go live, then **request re-indexing** in Google Search Console (I can trigger a sitemap resubmit once it's published) so Google refreshes the cached snippet faster (typically a few days).

## Notes

- The `<title>` and `<meta name="description">` are already correct ("QP Hub — Access and Share Question Papers"), so the text branding will update on the next Google re-crawl.
- Google can take days to weeks to refresh cached results; the favicon and OG image fixes are what will make the next crawl show correct branding.
