# Changelog

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
