# Article Cover Image Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate, install, and verify ten distinct bilingual-safe article cover illustrations that replace the repeated runtime placeholders.

**Architecture:** Run the bundled OpenAI image CLI once with a temporary ten-job JSONL manifest, inspect the named source images, and center-crop approved sources into stable 1600x900 files under `public/images/articles/`. The existing article paths remain unchanged; the dynamic placeholder route is removed only after every static file passes relevance, safety, and dimension checks.

**Tech Stack:** OpenAI Image API (`gpt-image-1.5`), bundled `image_gen.py`, `uv`, Pillow, Next.js 16 `next/image`, Node test runner, Playwright.

---

### Task 1: Add a failing static-cover contract test

**Files:**
- Create: `tests/article-images.test.ts`
- Reference: `src/content/articles/catalog.ts`

- [ ] **Step 1: Write the failing test**

Create a test that reads each catalog cover from `public/`, verifies the PNG signature, and reads the IHDR width and height without adding an image dependency:

```ts
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import path from "node:path"
import test from "node:test"
import { articleCatalog } from "../src/content/articles/catalog"

test("every article has a 1600x900 static PNG cover", async () => {
  assert.equal(articleCatalog.length, 10)

  for (const article of articleCatalog) {
    const file = await readFile(path.join(process.cwd(), "public", article.coverImage))
    assert.equal(file.subarray(1, 4).toString("ascii"), "PNG", article.key)
    assert.equal(file.readUInt32BE(16), 1600, article.key)
    assert.equal(file.readUInt32BE(20), 900, article.key)
  }
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run:

```powershell
rtk pnpm exec tsx --test tests/article-images.test.ts
```

Expected: FAIL with `ENOENT` for `public/images/articles/ai-subscription-guide.png`.

### Task 2: Generate ten named source images

**Files:**
- Create temporarily: `tmp/imagegen/article-covers.jsonl`
- Create: `output/imagegen/source/*.png`
- Reference: `docs/superpowers/specs/2026-07-15-article-cover-imagegen-design.md`

- [ ] **Step 1: Create the temporary batch manifest**

Write these ten independent JSONL jobs so each image repeats the style and safety constraints:

```jsonl
{"out":"ai-subscription-guide.png","prompt":"A topic-specific blog cover showing a decision desk with three abstract AI subscription panels, a practical checklist, and one clearly highlighted best-fit path","use_case":"stylized-concept","style":"premium editorial cut-paper illustration, bold black ink outlines, crisp geometric silhouettes, subtle handmade paper grain, layered physical depth","composition":"wide landscape, one clear central subject, balanced asymmetry, generous margins, all important objects inside the center-safe 16:9 crop","palette":"beliakun yellow, cyan, pink, lime, violet, black, and warm off-white; varied and balanced","materials":"matte colored paper, subtle grain, soft paper-cast shadows","constraints":"no text, letters, numbers, logos, trademarks, watermarks, gradients, provider UI, dominant face, or tiny critical details","negative":"generic SaaS art, stock imagery, glossy plastic, clutter, malformed objects, oversaturated neon","size":"1536x1024","quality":"high","output_format":"png"}
{"out":"chatgpt-paid-vs-free.png","prompt":"A topic-specific blog cover with a split work surface: a compact free AI toolkit on one side and an expanded paid AI toolkit on the other, both serving the same real task","use_case":"stylized-concept","style":"premium editorial cut-paper illustration, bold black ink outlines, crisp geometric silhouettes, subtle handmade paper grain, layered physical depth","composition":"wide landscape, clear left-versus-right comparison, strong center boundary, all important objects inside the center-safe 16:9 crop","palette":"cyan, yellow, violet, black, warm off-white, with restrained pink accents","materials":"matte colored paper, subtle grain, soft paper-cast shadows","constraints":"no text, letters, numbers, logos, trademarks, watermarks, gradients, copied UI, dominant face, or tiny critical details","negative":"generic pricing table, stock imagery, glossy 3D, clutter, malformed objects, oversaturated neon","size":"1536x1024","quality":"high","output_format":"png"}
{"out":"chatgpt-vs-gemini.png","prompt":"A topic-specific blog cover showing two distinct abstract AI workflow lanes processing different input shapes and converging on equally polished output, emphasizing workflow choice rather than rivalry","use_case":"stylized-concept","style":"premium editorial cut-paper illustration, bold black ink outlines, crisp geometric silhouettes, subtle handmade paper grain, layered physical depth","composition":"wide landscape, two clearly different flowing lanes, centered convergence, all important objects inside the center-safe 16:9 crop","palette":"pink and cyan lanes with yellow, lime, black, violet, and warm off-white supporting accents","materials":"matte colored paper, subtle grain, soft paper-cast shadows","constraints":"no text, letters, numbers, logos, trademarks, watermarks, gradients, provider mascots, copied UI, or tiny critical details","negative":"battle imagery, generic versus poster, glossy plastic, clutter, malformed symbols, oversaturated neon","size":"1536x1024","quality":"high","output_format":"png"}
{"out":"ai-stack-for-students.png","prompt":"A topic-specific blog cover showing a laptop, books, handwritten notes without legible writing, and a small modular AI toolkit arranged as a lean affordable student study kit","use_case":"stylized-concept","style":"premium editorial cut-paper illustration, bold black ink outlines, crisp geometric silhouettes, subtle handmade paper grain, layered physical depth","composition":"wide top-down study desk, compact central cluster, breathing room around objects, all important objects inside the center-safe 16:9 crop","palette":"lime, yellow, cyan, pink, black, violet, and warm off-white","materials":"matte colored paper, notebook paper grain, soft paper-cast shadows","constraints":"no readable text, letters, numbers, logos, trademarks, watermarks, gradients, dominant face, or tiny critical details","negative":"expensive luxury desk, generic stock student, glossy devices, clutter, malformed hands, oversaturated neon","size":"1536x1024","quality":"high","output_format":"png"}
{"out":"ai-for-thesis-research.png","prompt":"A topic-specific blog cover showing research papers without writing, connected citation links, a magnifier, and verification marks forming a responsible evidence workflow","use_case":"stylized-concept","style":"premium editorial cut-paper illustration, bold black ink outlines, crisp geometric silhouettes, subtle handmade paper grain, layered physical depth","composition":"wide landscape, evidence trail moves clearly from source papers through verification to a finished document, center-safe 16:9 crop","palette":"violet, cyan, lime, yellow, black, pink, and warm off-white","materials":"matte colored paper, archival paper grain, soft paper-cast shadows","constraints":"no readable text, letters, numbers, logos, trademarks, watermarks, gradients, copied UI, dominant face, or tiny critical details","negative":"academic seal, fake citations, stock imagery, glossy plastic, clutter, malformed symbols, oversaturated neon","size":"1536x1024","quality":"high","output_format":"png"}
{"out":"api-key-beginners.png","prompt":"A topic-specific blog cover showing a luminous abstract digital key protected inside a solid server gateway and security shield, communicating safe API credential handling","use_case":"stylized-concept","style":"premium editorial cut-paper illustration, bold black ink outlines, crisp geometric silhouettes, subtle handmade paper grain, layered physical depth","composition":"wide landscape, strong protected key silhouette at center, server layers surrounding it, all important objects inside the center-safe 16:9 crop","palette":"yellow key, cyan server, lime shield, pink and violet accents, black, warm off-white","materials":"matte colored paper, subtle grain, soft paper-cast shadows","constraints":"no text, letters, numbers, code, logos, trademarks, watermarks, gradients, copied UI, or tiny critical details","negative":"physical house key photo, hacker cliche, padlock overload, glossy plastic, clutter, oversaturated neon","size":"1536x1024","quality":"high","output_format":"png"}
{"out":"token-cost-estimation.png","prompt":"A topic-specific blog cover showing small abstract token tiles flowing through a calculator mechanism into a controlled cost meter and neatly contained coin stack","use_case":"stylized-concept","style":"premium editorial cut-paper illustration, bold black ink outlines, crisp geometric silhouettes, subtle handmade paper grain, layered physical depth","composition":"wide left-to-right flow, tokens large enough for card view, calculator centered, all important objects inside the center-safe 16:9 crop","palette":"cyan tokens, yellow meter, violet calculator, lime and pink accents, black, warm off-white","materials":"matte colored paper, subtle grain, soft paper-cast shadows","constraints":"no readable text, letters, numbers, currency symbols, logos, trademarks, watermarks, gradients, copied UI, or tiny critical details","negative":"financial stock chart, crypto imagery, glossy plastic, clutter, malformed objects, oversaturated neon","size":"1536x1024","quality":"high","output_format":"png"}
{"out":"whatsapp-ai-bot.png","prompt":"A topic-specific blog cover showing green conversation bubbles moving through a verified server queue toward an abstract AI processing core, with a clear human escalation branch","use_case":"stylized-concept","style":"premium editorial cut-paper illustration, bold black ink outlines, crisp geometric silhouettes, subtle handmade paper grain, layered physical depth","composition":"wide left-to-right architecture flow, large bubbles and server nodes, clear branch, all important objects inside the center-safe 16:9 crop","palette":"lime conversation bubbles, cyan servers, yellow AI core, pink and violet accents, black, warm off-white","materials":"matte colored paper, subtle grain, soft paper-cast shadows","constraints":"no text, letters, numbers, WhatsApp logo, trademarks, watermarks, gradients, copied UI, dominant face, or tiny critical details","negative":"phone screenshot, generic chatbot mascot, glossy plastic, clutter, malformed symbols, oversaturated neon","size":"1536x1024","quality":"high","output_format":"png"}
{"out":"shared-vs-private.png","prompt":"A topic-specific blog cover comparing a shared key ring connected to several account doors with an isolated personal vault and single protected key, separated by a strong security boundary","use_case":"stylized-concept","style":"premium editorial cut-paper illustration, bold black ink outlines, crisp geometric silhouettes, subtle handmade paper grain, layered physical depth","composition":"wide split composition, shared side visibly interconnected, private side calm and isolated, all important objects inside the center-safe 16:9 crop","palette":"pink shared side, cyan private side, yellow keys, lime and violet accents, black, warm off-white","materials":"matte colored paper, subtle grain, soft paper-cast shadows","constraints":"no text, letters, numbers, logos, trademarks, watermarks, gradients, copied UI, dominant face, or tiny critical details","negative":"scary hacker imagery, generic padlock grid, glossy plastic, clutter, malformed keys, oversaturated neon","size":"1536x1024","quality":"high","output_format":"png"}
{"out":"safe-digital-subscriptions.png","prompt":"A topic-specific blog cover showing a verified digital checkout receipt without writing, a protected device, a security shield, and a clear confirmation mark in a trustworthy purchase scene","use_case":"stylized-concept","style":"premium editorial cut-paper illustration, bold black ink outlines, crisp geometric silhouettes, subtle handmade paper grain, layered physical depth","composition":"wide landscape, shielded checkout cluster centered, calm orderly spacing, all important objects inside the center-safe 16:9 crop","palette":"yellow, lime, cyan, pink, violet, black, and warm off-white with balanced contrast","materials":"matte colored paper, receipt paper grain, soft paper-cast shadows","constraints":"no readable text, letters, numbers, payment logos, trademarks, watermarks, gradients, copied UI, dominant face, or tiny critical details","negative":"credit card photo, ecommerce stock imagery, glossy plastic, clutter, malformed symbols, oversaturated neon","size":"1536x1024","quality":"high","output_format":"png"}
```

- [ ] **Step 2: Validate the batch without an API call**

Run:

```powershell
rtk uv run --with openai --with pillow python C:/Users/USER/.codex/skills/imagegen/scripts/image_gen.py generate-batch --input tmp/imagegen/article-covers.jsonl --out-dir output/imagegen/source --concurrency 3 --dry-run
```

Expected: ten request previews, each using `gpt-image-1.5`, `1536x1024`, `high`, and a distinct `out` filename.

- [ ] **Step 3: Run the live image batch**

Run the same command without `--dry-run` and allow retries:

```powershell
rtk uv run --with openai --with pillow python C:/Users/USER/.codex/skills/imagegen/scripts/image_gen.py generate-batch --input tmp/imagegen/article-covers.jsonl --out-dir output/imagegen/source --concurrency 3 --max-attempts 3 --force
```

Expected: ten named PNG files in `output/imagegen/source/`, with no failed jobs.

- [ ] **Step 4: Remove the temporary manifest**

Verify `D:\Aplikasi\geraiakun\tmp\imagegen\article-covers.jsonl` resolves inside the workspace, then delete only that file.

### Task 3: Inspect and process final assets

**Files:**
- Read: `output/imagegen/source/*.png`
- Create: `public/images/articles/*.png`

- [ ] **Step 1: Inspect every source image**

Use the local image viewer on all ten files. Reject an asset if it is off-topic, violates the no-text/no-logo rule, has malformed objects, lacks the shared cut-paper treatment, or loses its subject at card size.

- [ ] **Step 2: Regenerate only rejected jobs**

Create a temporary JSONL containing only rejected jobs, change one prompt dimension at a time, rerun `generate-batch`, inspect again, and delete the retry manifest. Do not overwrite approved assets until the retry passes.

- [ ] **Step 3: Center-crop approved sources to 1600x900**

Use Pillow's `ImageOps.fit` with LANCZOS resampling to crop every named source into `public/images/articles/`:

```powershell
rtk uv run --with pillow python -c "from pathlib import Path; from PIL import Image,ImageOps; src=Path('output/imagegen/source'); dst=Path('public/images/articles'); dst.mkdir(parents=True,exist_ok=True); [(ImageOps.fit(Image.open(p).convert('RGB'),(1600,900),method=Image.Resampling.LANCZOS,centering=(0.5,0.5)).save(dst/p.name,format='PNG',optimize=True)) for p in sorted(src.glob('*.png'))]"
```

Expected: ten optimized 1600x900 PNG files with stable article-key filenames.

- [ ] **Step 4: Inspect all final crops**

View the final ten files and verify that no focal object is clipped. If a crop fails, adjust only that source's `centering=(x, y)` and re-export it.

### Task 4: Switch the application from placeholders to static covers

**Files:**
- Delete: `src/app/images/articles/[filename]/route.tsx`
- Keep unchanged: `src/content/articles/*.ts`
- Test: `tests/article-images.test.ts`

- [ ] **Step 1: Remove the dynamic placeholder route**

Delete the route only after `public/images/articles/` contains all ten approved images. The article catalog paths already point to the same public URLs.

- [ ] **Step 2: Run the static-cover contract test**

Run:

```powershell
rtk pnpm exec tsx --test tests/article-images.test.ts
```

Expected: PASS for ten PNG files at 1600x900.

- [ ] **Step 3: Run article and type checks**

Run:

```powershell
rtk pnpm run test:articles
rtk pnpm exec tsc --noEmit
rtk pnpm exec biome check tests/article-images.test.ts src/content/articles src/components/storefront/article-list.tsx
rtk git diff --check
```

Expected: all tests pass, TypeScript and Biome emit no errors, and `git diff --check` is empty.

Because the workspace already contains overlapping uncommitted article work owned by the user, do not create implementation commits or stage unrelated files. Report the exact generated assets and source changes instead.

### Task 5: Verify storefront and production rendering

**Files:**
- Verify: `public/images/articles/*.png`
- Verify: `src/components/storefront/article-list.tsx`
- Verify: `src/app/[locale]/(storefront)/artikel/[slug]/page.tsx`

- [ ] **Step 1: Verify all static URLs**

Request each `/images/articles/<key>.png` URL and expect `200` with `content-type: image/png`.

- [ ] **Step 2: Check ID and EN article grids**

Use Playwright at desktop and mobile widths on `/id/artikel` and `/en/artikel`. Confirm all ten covers are distinct, load without layout shift, remain recognizable at card size, and have no overlap or broken images.

- [ ] **Step 3: Check representative detail and metadata output**

Open one Indonesian and one English detail page. Confirm the cover URL used by Open Graph/Twitter metadata returns the correct static image and reciprocal language navigation still works.

- [ ] **Step 4: Run the production build**

Run:

```powershell
rtk pnpm run build
```

Expected: Next.js production build succeeds and the removed dynamic image route no longer appears in the route table.

- [ ] **Step 5: Final browser console check**

On the running local server, confirm the article list has zero console errors and no broken-image network responses. Leave the development server running and report `http://localhost:3000/id/artikel` to the user.
