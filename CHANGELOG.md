# Changelog

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

[1.4.6]: https://github.com/connorlhunter/connorhunter/compare/v1.4.5...v1.4.6
[1.4.5]: https://github.com/connorlhunter/connorhunter/compare/v1.4.4...v1.4.5
[1.4.4]: https://github.com/connorlhunter/connorhunter/compare/v1.4.3...v1.4.4
[1.4.3]: https://github.com/connorlhunter/connorhunter/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/connorlhunter/connorhunter/compare/v1.4.1...v1.4.2
