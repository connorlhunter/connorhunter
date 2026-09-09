# Changelog

## [1.4.21] - 2026-09-09

### Changed

- Run React Doctor in the shared local and CI verification command.
- Simplify route validation, viewer state, component boundaries, and unused exports.
- Improve document keys and accessible list and button markup.

### Fixed

- Patch the transitive YAML parser against a denial-of-service advisory.
- Preserve theme messages for trusted sandboxed artifact frames.
- Keep the document and theme providers mounted when retrying a failed root loader.

## [1.4.20] - 2026-09-07

### Fixed

- Keep the header pinned while scrolling and extend its theme background into the iPhone safe area.
- Reuse first-paint theme metadata during hydration so a saved dark theme does not create duplicate tags.
- Respect safe-area spacing in navigation, page content, reader sidebars, and fullscreen viewers.
- Disable transitions when reduced motion is enabled.

### Changed

- Update TanStack, Vite+, PDF.js, icons, and related dependencies.

## [1.4.19] - 2026-09-05

### Removed

- Remove the footer dynamic content control and its saved state, page props, and styles.
- Remove phone contacts, public phone settings, and the phone entry in the fallback footer.

### Changed

- Update the internship troubleshooting description in the experience page and resume.

## [1.4.18] - 2026-09-05

### Fixed

- Keep the page theme and browser colors aligned after navigation, tab restoration, and delayed preference updates.
- Give mobile project summaries the full header width and wrap resource navigation without clipping.
- Ignore obsolete PDF renders and reset coverage selection when changing projects.

### Changed

- Share resource requests through TanStack Query with cancellation, caching, and retry controls.
- Use client navigation for app links while preserving normal downloads, external links, and modified clicks.
- Separate the resource readers, share their sidebar controls, and remove retired viewer styling.
- Simplify React browser subscriptions and refs, and enable unused-code checks.
- Share coverage and changelog publishing helpers and reject empty or malformed LCOV reports.
- Update the architecture, content, and release documentation.

## [1.4.17] - 2026-09-05

### Changed

- Replaced the palette cycle with Light and Dark themes, a sun/moon toggle, and automatic migration of saved preferences.
- Added restrained sunset accents, simplified card styling, and reduced decorative motion across the portfolio.
- Refined Featured Work with row dividers and a peach Live badge, simplified the Explore heading, and improved light-mode text contrast.

### Fixed

- Prevent delayed cross-tab theme updates from overwriting newer saved preferences.

## [1.4.16] - 2026-09-05

### Removed

- Removed extra Featured Work pages so the homepage featured panel shows only the original project cards.

## [1.4.15] - 2026-08-27

### Fixed

- Keep project reader navigation and page outlines pinned below the site header while their content is in view.

## [1.4.14] - 2026-08-27

### Changed

- Read project docs, diagrams, coverage, and changelogs as native resources instead of embedded HTML reports.
- Simplified project navigation and added stable page controls for documentation.

## [1.4.13] - 2026-08-26

### Changed

- Replaced the separate frontend toolchain commands with Vite+.
- Added a 15-path cyclomatic-complexity limit for application code and simplified the shared viewer and drawer paths to meet it.
- Removed obsolete formatter and linter configuration.

## [1.4.12] - 2026-08-23

### Changed

- Added contextual project details to configurable featured image pages, including the project mark, short description, and matching status chip.
- Kept the carousel image surface clean while placing slide details in its existing footer row.

## [1.4.11] - 2026-08-23

### Added

- Added configurable, looping featured-work pages with linked image slides, optional overlay badges, keyboard controls, and mobile swipe support.

### Changed

- Moved dynamic-content details into a stable footer control with a centered popover.

## [1.4.10] - 2026-08-20

### Changed

- Simplified portfolio footer and coverage update labels to concise date-only wording.
- Display versioned diagram labels as readable titles with version and update-date metadata.
- Made diagram controls wrap cleanly at narrow viewport widths.

## [1.4.9] - 2026-08-20

### Changed

- Stamp portfolio coverage with one project-owned UTC publication timestamp.
- Render the coverage PDF from the exact stamped HTML before publishing the scoped coverage bundle.

## [1.4.8] - 2026-08-18

### Fixed

- Complete cached diagram previews after in-app project navigation.
- Keep the mobile resume page controls above the drawer resize handle.

## [1.4.7] - 2026-08-18

### Changed

- Enforced semantic naming for branches, issues, pull requests, and commits.
- Disabled blank issue submissions so the available forms retain their change prefixes.

### Fixed

- Loaded public test defaults directly from `.env.example`, allowing a fresh checkout to run verification without an ignored `.env` file.

## [1.4.6] - 2026-08-14

### Added

- Required CodeQL CLI 2.26.3 on `PATH` for local verification.
- Scanned JavaScript, TypeScript, and GitHub Actions with the security-extended queries and local threat sources.

### Changed

- Included the local CodeQL scan in `verify`, pre-commit, and pre-push checks while deferring GitHub Actions runs to hosted CodeQL.
- Documented branch prefixes and matching Conventional Commit types in the README.

## [1.4.5] - 2026-08-14

### Added

- Loaded the portfolio update date from the published content manifest with the configured public date as a fallback.
- Published refreshed Cipher project, skills, and resume content with CodeQL alongside GitHub Actions.
- Added a security policy, Dependabot coverage, and a release-version check to hosted verification.

### Changed

- Required both the trusted iframe source and configured artifact origin before applying embedded theme messages.
- Refreshed supported dependencies while keeping the standard TypeScript compiler on 6.x.

### Fixed

- Confined generated coverage artifacts to the documented coverage directory.
- Parsed artifact URLs before asserting their trusted origin in tests.

## [1.4.4] - 2026-08-02

### Changed

- Increased the resume drawer drag target while keeping the visible grip compact.
- Reduced the movement needed to begin resizing on mobile.

### Fixed

- Reused drawer measurements across drag frames for smoother resizing.
- Added clearer pressed and active feedback to the drawer handle.

## [1.4.3] - 2026-08-02

### Changed

- Moved the dynamic content badge to the upper-right edge on mobile and desktop.
- Reversed the badge layout so its details expand left from the anchored cloud control.

### Fixed

- Kept expanded badge text readable within narrow mobile viewports.

## [1.4.2] - 2026-08-02

### Added

- Added a floating drawer handle to the resume viewer controls.

### Changed

- Split the resume actions and page navigation into two snap points.
- Let the resume preview fill the available desktop fullscreen height when the controls are collapsed.

### Fixed

- Removed the permanent toolbar footprint from the fullscreen resume view.
- Kept fullscreen unavailable on mobile while allowing the controls to collapse for more viewing room.

[1.4.13]: https://github.com/connorlhunter/connorhunter/compare/v1.4.12...v1.4.13
[1.4.12]: https://github.com/connorlhunter/connorhunter/compare/v1.4.11...v1.4.12
[1.4.11]: https://github.com/connorlhunter/connorhunter/compare/v1.4.10...v1.4.11
[1.4.10]: https://github.com/connorlhunter/connorhunter/compare/v1.4.9...v1.4.10
[1.4.9]: https://github.com/connorlhunter/connorhunter/compare/v1.4.8...v1.4.9
[1.4.8]: https://github.com/connorlhunter/connorhunter/compare/v1.4.7...v1.4.8
[1.4.7]: https://github.com/connorlhunter/connorhunter/compare/v1.4.6...v1.4.7
[1.4.6]: https://github.com/connorlhunter/connorhunter/compare/v1.4.5...v1.4.6
[1.4.5]: https://github.com/connorlhunter/connorhunter/compare/v1.4.4...v1.4.5
[1.4.4]: https://github.com/connorlhunter/connorhunter/compare/v1.4.3...v1.4.4
[1.4.3]: https://github.com/connorlhunter/connorhunter/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/connorlhunter/connorhunter/compare/v1.4.1...v1.4.2
