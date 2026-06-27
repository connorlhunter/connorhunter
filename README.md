# Connor Hunter Portfolio

Content-backed portfolio app for profile content, project pages, artifact viewers, coverage links, and resume delivery.

Detailed project documentation is published on the live portfolio:

- https://connorhunter.me/projects/connor-hunter?viewer=docs#project-viewer

## Start Here

```bash
bun install
bun run dev
bun run typecheck
bun run format:check
bun run test:coverage
```

The app is built with TanStack Start, Vite, React, TanStack Router, Zod, Tailwind CSS, shadcn-style primitives, and Lucide icons. Portfolio content comes from artifact manifests and markdown frontmatter instead of being buried in React components.

## Runtime Content

Local development and production both read portfolio artifacts through CloudFront-backed public origins:

```text
VITE_PUBLIC_ARTIFACTS_ORIGIN -> CloudFront artifact root
VITE_PUBLIC_ASSETS_ORIGIN    -> CloudFront static asset root
VITE_PUBLIC_SITE_ORIGIN      -> https://connorhunter.me
```

Before DNS is configured, the artifact and asset origins may be raw CloudFront
distribution domain names such as `https://d111111abcdef8.cloudfront.net`.
Do not use CloudFront distribution IDs such as `E1CSMY761RI4LF` in these URL
variables.

The artifact root serves manifests, profile markdown, project markdown, docs, diagrams, and project coverage URLs. Artifact Generator publishes docs and diagrams. This repo publishes the Portfolio coverage page under `projects/connor-hunter/coverage/`. The asset root serves icons, crypto images, and the resume PDF.

S3 buckets should stay private behind CloudFront. Both published S3 buckets use restricted CORS origins, and both CloudFront distributions use `Managed-CORS-S3Origin` with `Managed-CachingDisabled` so browser fetches get exact allowed-origin headers, including `304` revalidation responses.

## Common Commands

| Task                | Command                    |
| ------------------- | -------------------------- |
| Start local app     | `bun run dev`              |
| Build app           | `bun run build`            |
| Run tests           | `bun run test`             |
| Run coverage        | `bun run test:coverage`    |
| Publish coverage    | `bun run coverage:publish` |
| Check formatting    | `bun run format:check`     |
| Run lint            | `bun run lint`             |
| Typecheck           | `bun run typecheck`        |
| Run full validation | `bun run verify`           |

## Project Shape

```text
src/routes/       -> TanStack Router route files
src/features/     -> page and feature components
src/content/      -> artifact-backed content loading and Zod schemas
src/features/viewer/ -> shared file viewer and drawer behavior
public/           -> app-owned public shell assets only
```

Artifact generation and publishing are handled by the Artifact Generator project. This app consumes the published output through CloudFront-backed environment variables. Amplify is only used as the hosting/deploy target for the TanStack Start app; this repo does not define an Amplify Gen 2 backend or require local backend commands.

## Coverage Publishing

Portfolio coverage is the one artifact this repo publishes itself:

```bash
bun run coverage:publish
```

The script runs the coverage gate, renders `coverage/index.html`, syncs the coverage folder to `projects/connor-hunter/coverage/`, and invalidates the artifact CloudFront path when `ARTIFACTS_CLOUDFRONT_DISTRIBUTION_ID` is set. Set `ARTIFACTS_BUCKET` for the live artifact bucket; set `SOURCE_ARTIFACTS_BUCKET` too when you also want a durable source copy.
