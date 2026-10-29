# Basketball Journey — visual upgrade (2.0)

A mobile-first, blue-and-white basketball development PWA. Independent and school-inspired, with no official crest or school affiliation.

## What changed
- Responsive Home, Progress, Games and Team screens, original court/basketball SVG artwork and a Play / Reflect / Grow path.
- Local player photo selection, resizing to a maximum 640px dimension, and removal. No player identity is bundled.
- Local PDF/JPEG/PNG/WebP box-score attachments (8 MB each), an original-file viewer, and explicit manual verification before saving a game.
- Per-game points, minutes, steals, turnovers and fouls. Missing numbers display as unknown, not invented ratings.
- Existing goals, challenges, post-game check-ins and the `basketball-journey-v1` storage key are preserved.
- Version 2 private JSON backups include attached originals and the photo. Version 1 backups remain supported.

## Import previous games
Games → Add → choose the original PDF or photo. Open the PDF or view the image, locate the correct player row, and manually enter the date, opponent, team scores and player statistics. Tick the verification checkbox before saving. Minutes use decimal minutes: for example 12:30 is 12.5, not 12.30. Leave unknown statistics blank.

There is **no automatic PDF extraction or OCR**. A file being accepted does not establish that its contents are correct. The previously discussed October 17, 24 and 28, 2026 files and athlete photo were unavailable during implementation; no records or substitute athlete images were invented. Import each original locally when available.

## Privacy and persistence
Game data remains in localStorage; photos and source files remain in IndexedDB (`basketball-journey-media`). Media is not committed, sent to a server, or synced. There are no external fonts, analytics, OCR services or cloud APIs. Photo processing strips the original image file by re-encoding it locally. Source PDFs/photos are retained unchanged and may contain private metadata.

More → Export JSON backup downloads an **unencrypted private file** including personal data and media. Keep it private. Transfer that backup directly to another device and use More → Import JSON. Import merges new game IDs, keeps existing records/photo/settings, and de-duplicates identical check-ins. Conflicting game IDs keep the current device's game. On an unused device, goals and challenges are restored from the backup. A v1 backup has no media. Export before clearing browser storage; the site cannot recover erased local data. The current importer accepts backups up to 100 MB.

Storage belongs to the exact browser and origin: `http://`, `https://`, the GitHub Pages address and a custom domain have separate storage. Export from the old origin before switching. No automatic data migration across these origins is possible. Deleting a saved game also deletes its check-ins and unshared source attachment. Replacing or abandoning an unsaved source may leave an unused local attachment; it is excluded from exports and never uploaded.

## Install / update
Use https://hoops.gridway.com.au/ . On iPhone Safari: Share → Add to Home Screen → Add. On Android Chrome: menu → Install app / Add to Home screen. Visit online once before testing airplane mode. Raster 192px/512px app icons and an Apple touch icon are included.

For an existing installation, first export a backup. Open online, then close all open app/browser tabs for this site and reopen to allow a waiting service worker to activate. Do not clear site data as an update step. Version 2.0 appears under More → About. An actual iOS/Android installation should be checked on the target phone; desktop browser tests do not certify mobile OS installation behavior.

## Deployment
This is a static app; no build or runtime package installation is needed. GitHub Pages serves `main` at `/`, and `CNAME` retains `hoops.gridway.com.au`. Publish app code and generic artwork only. The service worker caches the complete shell, waits for old clients to close, and only removes caches with this application's prefix. Increment its cache name whenever shipping further app changes. GitHub Pages/edge caching may delay visible updates.

## Development and tests
Use a local HTTP server (not file://), e.g. `python -m http.server 4173`. For automated checks, install Node.js and Microsoft Edge, then `npm install` and `npm test`. Tests use an isolated headless Edge profile and synthetic data only. Alternatively change the Playwright channel to your installed test browser. No production user data is accessed.

`tests/smoke.cjs` checks responsive layouts, verified game submission, local PDF attachment and photo, reload persistence, private backup contents, fresh-device media restore, merge/deduplication, invalid backup rejection, v1 data compatibility, goals/check-ins, trends, offline reload and deletion. Screenshots are written to ignored `test-results/`. The PDF test fixture verifies attachment handling only, not rendering or extraction of a real FIBA file.

Browser verification performed with Playwright 1.62.1 and local Microsoft Edge at 390×844 and 1280×900. Native Safari/Android installation and the missing source score sheets require follow-up verification.

## 2.1 reference-layout revision
The homepage now follows the selected player dashboard composition: portrait/profile identity, illustrated goal and challenge cards, points line chart with a 5/10/all-games selector, latest-game stats, team illustration and four primary navigation tabs. Settings and check-in are available in the header. Name/team are entered locally and included in private backups. Generic generated illustrations are decorative, not player photographs. Bootstrap Icons 1.11.3 is bundled locally under its MIT license.

The school crest is not included: its public site refused the asset request. The header currently uses the generic basketball brand. The supplied reference's fictional composure values and automatic-recording labels are replaced by recorded points and honest data-source labels. Native phone chrome is not recreated.

## 2.2 converted JSON import and review
Games now accepts converted schema_version 1.0 JSON with games, players, team_totals and validation_issues. Choose team/player, preview, acknowledge review notes, then import new games. PDF/photo re-upload is optional. Data stays in the browser; no dataset is bundled in this repository.

The importer preserves selected player source rows, team totals, original mm:ss time, conversion notes, file hash and issue rows. Time converts by seconds/60. It checks quarter totals, selected-player shooting points and basic player/team sums. Rebound/turnover/efficiency aggregation discrepancies are marked as context, not automatically corrected or certified. Other discrepancies require review; conversion date/minutes notes are shown for the relevant opponent. Full notes remain available per game. All imported records remain transcribed/unverified until originals are independently checked. Summary warnings appear in Games, Latest Game and Progress.

Duplicate import is skipped. Conflicting values for an existing game ID or matching date/opponent are shown and never overwritten. New games merge while preserving profile, media, check-ins and existing games. Exported private backups retain provenance/review flags. Tests use synthetic fixtures only and cover minutes, review classification, original-value preservation, duplicate/conflict handling, malformed input and browser import/reload behavior.

## 2.3 English labels, playing time and contribution summaries
All app-authored import/review labels are English. User-entered text and source notes remain unchanged. Playing time is rendered as mm:ss by rounding recorded decimal minutes to the nearest second; raw values, original source times and provenance are not rewritten.

Latest Game and each Team & Me card now have a per-game factual contribution summary, team-share context where a valid denominator exists, and a next-focus note drawn from that game's turnovers/personal fouls. Titles describe drawing fouls, creating for teammates, scoring, defensive activity or rebounding based on the available statistics. These are descriptive local rules, not MVP rankings, player ratings or assertions about unobserved possessions. Source-review caveats remain visible. The Home team card also reflects the latest recorded game instead of a fixed slogan.

Regression coverage includes mm:ss formatting and rounding, unknown values, distinct game summaries, guarded team percentages, unchanged source statistics, English UI, summary rendering and existing storage/import behavior. No migration or re-import is required.

## 2.4 game details and manageable team history
Latest Game → View now opens that recorded game's detail screen rather than the import form. Details include the selected player's contribution, review prompts with optional ball-security/foul-discipline practice suggestions, quarter scores, team totals and locally imported box-score rows for both teams. The selected player is highlighted; missing totals/rows remain unavailable.

Team & Me defaults to the latest game expanded, uses native collapsible cards, and provides newest/oldest date sorting, inclusive From/To filters, reset and Collapse all. Six matching games are shown per batch with an explicit Show next 6 action. View/filters do not modify data. Shared summary limitations and definitions live in one accessible explanation dialog (Close or Escape), rather than repeated per contribution card. Review prompts describe past turnovers/fouls, not targets or a diagnosis of their causes. Practice suggestions are general prompts for video review and coach discussion.

Earlier imports retained only the selected player. To add missing team rows, re-import the same converted JSON through Games and preview: unchanged records can receive a team-detail update. Existing player statistics, IDs, review flags, source provenance, profile, media and check-ins are kept. Changed player/source rows or already-saved roster/totals remain conflicts and are not overwritten. New imports retain same-game rows and team totals for both teams locally; private JSON backups include this information. No real roster is bundled or uploaded to GitHub.

Synthetic browser/unit checks cover direct navigation/back, missing-roster explanation, roster tables, metadata enrichment without duplicates or statistic replacement, date sort/filter/reset, collapse, six-game batches, mobile overflow containment, tips and dialog keyboard behavior, plus earlier import/storage/offline checks.
