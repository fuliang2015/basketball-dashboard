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

