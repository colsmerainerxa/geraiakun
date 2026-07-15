# Article Cover Image Generation Design

## Goal

Replace the repeated runtime placeholder covers with ten topic-specific bitmap illustrations. The covers must strengthen article recognition, match the bold beliakun storefront, work for both Indonesian and English content, and remain legible at card and social-preview sizes.

## Visual Direction

Use a consistent editorial cut-paper illustration system:

- thick black outlines and crisp geometric silhouettes;
- subtle paper grain and layered physical depth;
- a balanced mix of beliakun yellow, pink, cyan, lime, violet, black, and off-white;
- one clear subject per image with a strong central silhouette;
- landscape composition with all important details inside a center-safe 16:9 area;
- no text, letters, numbers, brand marks, watermarks, gradients, or dominant faces;
- no copied product UI, provider logos, or trademark-dependent imagery.

The shared style should make the collection feel related, while the dominant palette, objects, and composition vary enough that every article is recognizable at a glance.

## Article Mapping

| Key | Primary visual concept |
| --- | --- |
| `ai-subscription-guide` | A person-independent decision desk with three subscription panels, a checklist, and a highlighted best-fit path |
| `chatgpt-paid-vs-free` | A split scene with a compact free toolkit and an expanded paid toolkit connected to the same work surface |
| `chatgpt-vs-gemini` | Two distinct abstract AI workflow lanes processing different inputs and converging on polished output |
| `ai-stack-for-students` | A laptop, books, notes, and a small modular AI toolkit arranged like an affordable student study kit |
| `ai-for-thesis-research` | Research papers, citation links, a magnifier, and verification marks forming a responsible evidence workflow |
| `api-key-beginners` | A luminous digital key protected inside a server gateway and security shield |
| `token-cost-estimation` | Small token tiles flowing through a calculator and into a controlled cost meter |
| `whatsapp-ai-bot` | Green conversation bubbles moving through a secure server queue toward an abstract AI processing core |
| `shared-vs-private` | A shared key ring on one side and an isolated personal vault on the other, separated by a clear security boundary |
| `safe-digital-subscriptions` | A verified checkout receipt, protected device, shield, and confirmation mark in a trustworthy purchase scene |

## Generation Pipeline

Use the bundled OpenAI image generation CLI with `gpt-image-1.5` in one JSONL batch. Each job will combine the shared visual direction with its article-specific concept. Generate landscape source images at `1536x1024` with high quality, then center-crop and resize them to `1600x900` PNG files.

Intermediate generations belong in `output/imagegen/`. Approved final assets belong in `public/images/articles/` using the existing article keys as stable filenames. The temporary JSONL batch file must be removed after generation.

## Application Integration

Article records already reference `/images/articles/<key>.png`, so their database contract does not need to change. Remove the dynamic placeholder image route after all ten static files exist. Keep the current responsive `next/image` behavior and social metadata paths.

The same language-neutral cover will serve both the Indonesian and English translation of each article. This avoids embedded-language mismatch and keeps reciprocal metadata visually consistent.

## Quality Checks

Inspect every generated source and final crop for:

- direct relevance to the mapped article concept;
- consistent cut-paper style and black-outline treatment;
- no accidental text, logos, signatures, or watermarks;
- no malformed hands, faces, UI text, or nonsensical symbols;
- clear subject recognition at approximately 380x214 pixels;
- safe center crop with no important object cut off;
- sufficient contrast in light and dark storefront themes.

Regenerate only failed assets with a targeted prompt adjustment. After integration, verify all ten image URLs, the Indonesian and English article grids, representative detail pages, desktop/mobile screenshots, console output, article tests, TypeScript, formatting, and production build.

## Failure Handling

If the image API fails for an individual batch job, retry only that job. Never replace a successful image with a placeholder silently. Keep the existing runtime cover route until all ten static assets pass inspection, then remove it in the same implementation change that installs the final files.
