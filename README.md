# picsplit: X Split Tool

Split one image into seamless vertical tiles for X/Twitter multi-image posts.
100% client-side (Svelte + Vite + Canvas). No image data is ever uploaded to
a server.

## How it works

1. Drag & drop (or pick) an image.
2. Choose 2, 3, or 4 tiles. A live preview shows the cut lines.
3. Adjust **gutter trim** (0–10px, default 3px). This shaves pixels off each
   touching inner edge so the seams line back up once X renders its own gap
   between grid tiles.
4. Download each tile individually, or grab them all as a ZIP (via JSZip).
   Tiles keep the original filename with `-split1`, `-split2`, … appended.
5. Attach the tiles to your X post **in order** (split1, split2, …). X
   displays images by attach order, not filename.

## Development

```bash
pnpm install
pnpm run dev      # start local dev server
pnpm run build    # production build -> dist/
pnpm run preview  # preview the production build locally
```

## Deploying to GitHub Pages

A workflow at `.github/workflows/deploy.yml` builds the app with pnpm and
deploys `dist/` to GitHub Pages on every push to `main`.

To enable it on GitHub: **Settings → Pages → Build and deployment → Source:
GitHub Actions**. No further config is needed — `vite.config.js` uses a
relative `base` so the build works from any project subpath
(`https://<user>.github.io/<repo>/`).
