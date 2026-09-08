# Connor Hunter Portfolio

Content-backed portfolio app for project pages, native resource readers, coverage summaries, changelogs, and resume delivery.

Detailed project documentation is published on the live portfolio:

- https://connorhunter.me/projects/connor-hunter/docs

## Start Here

Prerequisites:

- Bun 1.3.14.
- CodeQL CLI 2.26.3 available as `codeql` on `PATH`.

```bash
bun install
bun run dev
bun run check
bun run test:coverage
bun run codeql:scan
```

The app is built with TanStack Start, Vite+, React, TanStack Router, TanStack Query, Zod, Tailwind CSS, shadcn-style primitives, and Lucide icons. Vite+ owns development, builds, formatting, linting, and type checks through the local project commands. Artifact Generator compiles source Markdown into structured JSON; this app owns the presentation and navigation.

## Runtime Content

By default, local development and production read portfolio artifacts through CloudFront-backed public origins:

```text
VITE_PUBLIC_ARTIFACTS_ORIGIN -> CloudFront artifact root
VITE_PUBLIC_ASSETS_ORIGIN    -> CloudFront static asset root
VITE_PUBLIC_SITE_ORIGIN      -> https://connorhunter.me
```

Before DNS is configured, the artifact and asset origins may be raw CloudFront
distribution domain names such as `https://d111111abcdef8.cloudfront.net`.
Do not use CloudFront distribution IDs such as `E1CSMY761RI4LF` in these URL
variables.

The artifact root serves the project manifest, compiled site content, structured docs, diagram metadata, coverage, and changelog artifacts. Artifact Generator owns source parsing and artifact assembly. This app reads those artifacts into native routes such as `/projects/cipher/docs`, `/projects/cipher/diagrams`, `/projects/cipher/coverage`, and `/projects/cipher/changelog`. The asset root serves icons, crypto images, and the resume PDF.

Portfolio content is deduplicated for 30 seconds in each running SSR instance, then reloaded from the artifact origin. After an artifact publish and CloudFront invalidation, allow up to 30 seconds for an already-warm SSR instance to refresh its content.

Browser resource readers share a TanStack Query cache for the current document. JSON and Markdown stay fresh for 30 seconds; unused entries expire after five minutes. Stale content refreshes on remount, window focus, or reconnection. Requests are cancelled when their last reader leaves, and failed initial loads offer a retry button. Each server-rendered document creates its own query client.

The root theme provider also survives client navigation. It keeps the page, browser color metadata, and saved preference aligned when switching themes or restoring a page from browser history. Internal app links use TanStack Router; external links and file downloads retain normal browser behavior.

S3 buckets should stay private behind CloudFront. Both published S3 buckets use restricted CORS origins, and both CloudFront distributions use `Managed-CORS-S3Origin` with `Managed-CachingDisabled` so browser fetches get exact allowed-origin headers, including `304` revalidation responses. Allow the production origins plus only the local development origins you actively use, such as `http://localhost:3000` and `http://localhost:5173`; do not use `*`.

## Common Commands

| Task                      | Command                    |
| ------------------------- | -------------------------- |
| Start local app           | `bun run dev`              |
| Build app                 | `bun run build`            |
| Check code                | `bun run check`            |
| Run tests                 | `bun run test`             |
| Run coverage              | `bun run test:coverage`    |
| Publish coverage          | `bun run coverage:publish` |
| Publish release artifacts | `bun run release:publish`  |
| Run local CodeQL          | `bun run codeql:scan`      |
| Run React Doctor          | `bun run doctor`           |
| Run full validation       | `bun run verify`           |

`bun run start` previews the most recent Amplify production build, so run `bun run build` first. It is not needed for normal local development; use `bun run dev` for that.

The test command loads the public defaults in `.env.example`, so a fresh checkout can run verification without creating `.env`. Explicit environment variables still take precedence. Copy `.env.example` to `.env` before local development when you need to change the defaults.

`bun run verify` runs the same validation gate in the commit and push hooks and GitHub Actions: release and branch naming checks, dependency auditing, Vite+ formatting, linting and type checks, React Doctor, test coverage, and CodeQL. In GitHub Actions, the CodeQL step defers to the repository's required hosted checks.

React Doctor scans the full project, blocks errors, and reports warnings without blocking. Generated files are excluded in `doctor.config.json`; no source rules are suppressed. Use `bun run doctor -- --verbose` for every finding or `bun run doctor -- --json` for structured output. The pinned CLI runs without telemetry, remote scoring, or Socket.dev checks; dependency auditing remains in `bun run audit`.

For theme or shell changes, check Safari and Brave on an iPhone in portrait and landscape: switch themes before and after scrolling, navigate between pages, then go back and reload. Check the notch area alongside the header. Browser emulation can verify layout and theme metadata, but it does not reproduce the native status bar. The opaque header must stay at the viewport's top edge so browsers can sample its current color.

Exact dependency pins and temporary release-age exceptions live in `dependency-policy.toml`. Run `bun run deps:policy` after changing the policy to sync `package.json` and `bunfig.toml`.

## Releases

`package.json` is the portfolio release-version source. Keep the first `CHANGELOG.md` heading aligned with it; `bun run version:check` enforces the pair in the normal verification gate. `bun run release:publish` publishes both coverage and the canonical changelog artifact.

## Change Naming

- Name branches `<type>/<kebab-summary>` with `feat`, `fix`, `chore`, `docs`, `test`, or `refactor`.
- Name issues, pull requests, and commit subjects `<type>[(scope)][!]: <summary>`, such as `feat(projects): add diagram preview`.
- Use `release/<version>` for a release branch, `chore(release): prepare <version>` for its release commit, and `v<version>` for the tag.
- Dependabot branches are accepted as an automated exception. Existing commit history is intentionally unchanged.

`bun run verify` checks the current branch, the commit hook checks each new commit subject, and CI checks pull request titles.

## Project Shape

```text
src/routes/       -> TanStack Router route files
src/features/     -> page and feature components
src/content/      -> artifact-backed content loading and Zod schemas
src/features/projects/ -> project detail and native resource readers
public/           -> app-owned public shell assets only
```

Artifact generation and publishing are handled by the Artifact Generator project. This app consumes the published output through CloudFront-backed environment variables. Amplify is only used as the hosting/deploy target for the TanStack Start app; this repo does not define an Amplify Gen 2 backend or require local backend commands.

## Report Publishing

This repository publishes its own coverage and changelog; Artifact Generator publishes the shared content. Coverage requires at least 95% lines, functions, and branches. The gate and report generator share an LCOV parser that rejects empty, incomplete, or inconsistent reports:

```bash
bun run coverage:publish
```

The script runs the coverage gate, creates one UTC publication timestamp, writes `coverage/index.json` and `coverage/coverage.pdf`, syncs the coverage folder to `projects/connor-hunter/coverage/`, and invalidates the artifact CloudFront path when `ARTIFACTS_CLOUDFRONT_DISTRIBUTION_ID` is set. The portfolio renders the JSON in its own coverage page and offers the PDF as a download. Set `ARTIFACTS_BUCKET` for the live artifact bucket; set `SOURCE_ARTIFACTS_BUCKET` too when you also want a durable source copy.

`bun run changelog:publish` builds and publishes `CHANGELOG.md` and its PDF under `projects/connor-hunter/changelog/`. Both publishers share destination resolution and command execution. Uploads must complete before their CloudFront paths are invalidated. These commands do not deploy the app or create a GitHub release.
