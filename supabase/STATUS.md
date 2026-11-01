# Private backend foundation — 1 November 2026

Status: database foundation verified; app integration is NOT complete.

## Completed
- Seven application tables created with RLS enabled: families, members, games, reflections, challenges, analysis jobs and reports.
- Parent/player permissions tested using synthetic database identities inside a transaction; transaction rolled back.
- Tested parent game creation, player published-game visibility and own reflection/challenge writes, outsider isolation, anonymous denial, report publication visibility and denial of client job access / report writes / membership changes.
- Post-test check: auth.users and all seven application tables contain zero rows.
- Security review identified default auto-RLS function execution grants. Removed PUBLIC, anon and authenticated execution privileges; confirmed both client roles denied.
- Follow-up security advisor: no WARN findings. One INFO remains for analysis jobs having RLS without client policies; intentional backend-only access.
- No real player records, photos, login accounts or AI requests were created.

## Limits and next work
- These are database role tests, not end-to-end login/API/browser tests or usable demo login accounts.
- Invite-only authentication, synthetic demo login provisioning and client integration remain to implement.
- Server-side game validation, current-version selection and AI input consent filtering remain to implement.
- AI report generation, freshness checking, guided follow-up and publication workflow remain to implement.
- Reflection rows represent shared responses. Do not upload local-only notes. AI may use only responses explicitly marked share_with_ai.
- Service-role credentials must stay on the server. GitHub stores code and synthetic fixtures only.
- Existing device data is unchanged. Do not migrate it automatically.

## Migration history
The SQL files match the already-applied remote migrations. Do not run them again on the existing project.
The auto-RLS hardening migration assumes the project-created public.rls_auto_enable function exists.
Security advisory reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy


## Account connection: 2.6.0
- Settings now provides email/password sign-in, server-verified parent/player membership and sign-out.
- Uses the vendored Supabase JS SDK 2.118.0; its license is in vendor/supabase-LICENSE.txt.
- Sessions use a separate sessionStorage key, survive a tab reload, and are not included in local backups. Closing the tab/app may require signing in again.
- No self-registration UI. Provision Auth accounts privately, then assign family memberships server-side. Never assign a role from browser input or user metadata.
- **Not connected yet:** game publication/sync, cloud reflections and AI reports. Dashboard records remain device-local even while signed in.
- Auth UI tests mock network responses and cover both roles, denied sign-in, no membership, reload and sign-out. Real-account acceptance remains pending account provisioning.
- Browser plugin not available for automated local tests; existing Playwright / Edge workflow used at 390x844 and 1280x900.

