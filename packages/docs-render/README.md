# @quillsocial/carousel-renderer (embedded in docs-render)

Render Instagram-ready PNG carousels and a LinkedIn PDF from JSON using Playwright (Chromium).

Quick start

1. Install deps and Playwright browsers:

```bash
npm install
npx playwright install --with-deps chromium
```

2. Build (if using TypeScript compilation):

```bash
npm run build --workspace=@quillsocial/docs-render
```

3. Node usage (example):

```ts
import data from './examples/sample.json';
import { renderImagesFromJson, renderPdfFromJson } from '@quillsocial/carousel-renderer';

await renderImagesFromJson(data);
await renderPdfFromJson(data);
```

CLI

```bash
node dist/cli.js images --in examples/sample.json --out out/ig
node dist/cli.js pdf --in examples/sample.json --out out/linkedin.pdf
```

Notes

- Deterministic fonts are used from system stacks; no external fonts are loaded.
- Ensure Playwright Chromium is installed in CI with `npx playwright install --with-deps chromium`.
