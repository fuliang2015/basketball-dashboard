# P2 status

## Delivered: 2.5.1
- First-impression prompt before statistics, optional note, Save or Skip opens the game.
- Latest-only batch handling, once per game, no prompt after statistic corrections.
- View/edit feelings in game details, preserve original challenge context and legacy check-ins.
- Local persistence, private backup merge, automated regression coverage.

## Backlog: agreed, not implemented yet
- Local Help & feedback: quick help, problem/suggestion drafts, private export.
- Focus progress: distinguish statistical evidence, feelings and challenge reflection.
- Multi-game comparison with sample size, playing time and insufficient-data states.
- Backup recency, clearer restore conflict preview.
- Complete historical report viewer and audited data corrections.

## Issue tracking
Record reproduction, expected result, affected version, acceptance check and fixed version. States: Backlog, In progress, Ready to verify, Done. Public tracking uses synthetic examples only. This is the repository status list; no GitHub board or Issues are claimed to exist.

## Remaining acceptance
Check update and safe-area/keyboard behavior on the installed phone. Automated tests use isolated Edge at 390x844 and 1280x900.

## Account connection: 2.6.0
- Settings now provides email/password sign-in, server-verified parent/player membership and sign-out.
- Uses the vendored Supabase JS SDK 2.118.0; its license is in vendor/supabase-LICENSE.txt.
- Sessions use a separate sessionStorage key, survive a tab reload, and are not included in local backups. Closing the tab/app may require signing in again.
- No self-registration UI. Provision Auth accounts privately, then assign family memberships server-side. Never assign a role from browser input or user metadata.
- **Not connected yet:** game publication/sync, cloud reflections and AI reports. Dashboard records remain device-local even while signed in.
- Auth UI tests mock network responses and cover both roles, denied sign-in, no membership, reload and sign-out. Real-account acceptance remains pending account provisioning.
- Browser plugin not available for automated local tests; existing Playwright / Edge workflow used at 390x844 and 1280x900.


## Published cloud journey: 2.7.0 (2 November 2026)

Delivered:
- Signed-in Home / Progress / Games / Team read published private records. Parent accounts select a linked player; player accounts see their own published games and report through existing database RLS.
- Latest version per player/source game wins; earlier versions remain in the database.
- Game details include quarter scores, both team totals, complete roster statistics and collapsed source notes.
- A saved AI-assisted review is displayed only when its game-version list exactly matches current published games. New/corrected games make an older report unavailable until a new review is published.
- Cloud records are held in memory, never merged into the legacy local-storage key, exported with local backups, or cached by the service worker. Sign-out and account changes clear cloud screens. Photos and existing local records remain untouched.
- No OpenAI API, automatic generation or open chat. The report is prepared locally and published to Supabase. No feelings were supplied for the initial review; local reflections are not silently uploaded.
- No additional player accounts were created. Each future player requires explicit account/member mapping and publication of that player's games/report. Roster availability does not grant account access or expose private reflections.

Local publication workflow:
1. Keep original converted JSON and a locally authored report outside this public repository.
2. Prepare a private identity JSON with family_id, player_id, created_by (parent), team, player and a new integer version.
3. Run tools/build-cloud-publication.cjs with identity JSON, report JSON, output SQL and one or more converted datasets as positional arguments.
4. Review facts against source rows. Execute the private SQL through an authorized database admin connection. It writes new versions and a saved report atomically, rejects conflicting existing revisions, and skips exact duplicates.
5. Verify the intended user's database access. The app reads updates on login, Refresh or returning to a visible tab after one minute.

Validation:
- Complete existing regression suite plus tests/cloud.cjs passed in Edge.
- Cloud test: latest-version deduplication, report freshness, team drill-down, failed reads, sign-out/account switching, local-data preservation; 390x844 and 1280x900.
- Live database role check confirmed the intended player can read the newly published games, roster rows and saved report.
- Browser plugin unavailable for local automated QA; existing Playwright/Edge workflow used.
- Real mobile login after deployment still requires the account holder; no passwords were read or stored in source.

Limits:
- Initial shared data is published on behalf of the configured player. Other players' source rows are retained in each match roster, but their separate account mappings and personal reports are not provisioned automatically.
- Feelings remain device-local in this release. To include them in the next locally prepared review, share/export them deliberately; there is no automatic AI feedback loop.
- Cloud viewing requires a network connection. Sign out to return to the legacy device-local dashboard.
