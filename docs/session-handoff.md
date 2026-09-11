# DEVLINK SESSION HANDOFF

CURRENT NEXT STAGE:
STEP 12 (FINAL UI/UX REDESIGN) — FINAL PASS. Frontend transformed per Stitch layout
reference + Mayora color system; backend untouched (65/65 tests stand). All 12 steps
classic COMPLETE. Do NOT restart or re-verify Steps 1–11. Remaining future work is only
non-feature polish listed in PROJECT_STATE.md "Remaining Work".

## Step 12 Session — Final UI/UX Redesign COMPLETE

**Step 12 status: FINAL PASS** (frontend-only; zero backend changes).

**Files created:**
- frontend/src/pages/proposals/ProposalsReceivedPage.jsx (client "Proposals Received"
  inbox at /proposals/received — reachable from navbar; aggregates offers across owned
  jobs from existing endpoints).

**Files rewritten/redesigned:**
- components/layout/Navbar.jsx (role-aware: anon/client/freelancer; Post a Job CTA
  client-only; Messages top-level preserved; mobile hamburger kept)
- pages/jobs/JobMarketplace.jsx (Stitch 2-col feed + sidebar; Popular Technologies
  chips w/ real counts; live open-jobs count; anon join card)
- components/jobs/JobCard.jsx (horizontal marketplace card: avatar, posted time, status,
  skills, budget/deadline footer, hover lift; exported JobStatusBadge)
- pages/auth/LoginPage.jsx + pages/auth/RegisterPage.jsx (split-screen red brand panel;
  register role cards "I want to hire / I want to freelance"; visibility toggle kept;
  payload/auth flow unchanged; login 500-on-bad-credentials mapped to friendly message)
- pages/proposals/ProposalList.jsx (card polish) + ProposalDetail.jsx (negotiation
  timeline: rail + status dots + Offer #/Initial Offer tags; actions unchanged)
- pages/projects/ProjectDetail.jsx (lifecycle stepper In Progress→Submitted→Completed
  with Revision annotation; role gating untouched)
- pages/messages/MessagesPage.jsx (conversation avatars/hover/Open chat →)
- pages/profile/ProfilePage.jsx (removed duplicate reviewer subline)

**Bugs found & fixed in Step 12:**
1. Skill-pill click applied filters.search without syncing JobFilters input → invisible
   stuck search. Fix: pills became informational chips (backend search only covers
   title/description — honest UI); JobFilters key-sync added.
2. JobCard unused variable (lint). Removed.
3. Wrong-credential login displayed generic "unexpected error" (backend 500 vs 401
   pre-existing gap, documented in Step 11). Frontend now shows a credential-oriented
   message. Backend NOT changed.

**Browser E2E (real browser, both roles, new UI):**
- Register (role cards) → 201 → /login PASS; login failure shows clean error PASS
- Client login → /jobs redirect + client navbar PASS; /proposals/received 2 real
  proposals PASS; Messages 2 conversations → chat deep link PASS; chat Live + STOMP
  send delivered + input cleared PASS; landing role CTAs PASS
- Freelancer login → navbar (Find Jobs / My Proposals / Messages / Projects, no Post a
  Job) PASS; proposals list + negotiation timeline (Offer #1, Accepted, rail) PASS;
  projects list + detail lifecycle stepper PASS; profile 5.0/5 + reviews PASS
- Marketplace: 16 cards + sidebar; hero live "6 open projects"; backend search "S11"
  → 6 results w/ synced input; clear restores; sort intact PASS
- Job detail (client-owned) status/budget/deadline/skills PASS
- Responsive 436px: no horizontal overflow; hamburger menu functional PASS
- Console: clean (only Vite HMR + one EXPECTED 500 from deliberate wrong-credential
  test); no unexpected network errors

**Quality gates:** pnpm lint → 0 errors, 12 warnings (11 pre-existing + 1 documented
set-state-in-effect in ProposalsReceivedPage, same data-load family as existing pages);
pnpm build → PASS (468.10 kB). Backend unchanged — tests remain 65/65.

**Known limitations (documented, non-blocking):**
- Login with unknown email → backend 500 (pre-existing; friendly message client-side;
  true 401 requires a backend change, out of scope under architecture lock)
- Skill chips are informational (backend search covers title/description only)
- Proposal last-activity timestamps and unread counts not available from backend
- Some preview screenshots during the session returned stale frames; DOM-level
  evaluations were used as the authoritative evidence for those pages

## Step 11 Session — Final Integration Audit COMPLETE

**Step 11 status: FINAL PASS.** This was an AUDIT-ONLY step: no application code was
modified. Full evidence recorded in PROJECT_STATE.md "Latest Verification".

**What was executed:**
1. Backend: full test suite 65/65 PASS + `./mvnw clean install -DskipTests` BUILD SUCCESS.
2. Frontend: pnpm lint (0 errors, 11 documented warnings) + pnpm build PASS (447.30 kB).
3. API authorization negative matrix: 58 checks with 4 fresh accounts — anonymous 401s,
   invalid JWT 401, role/ownership 403s, recipient-only offer rule (409), supersede +
   history preservation, acceptance transaction (1 project, job IN_PROGRESS, competing
   proposal REJECTED), full lifecycle incl. revision cycle + terminal COMPLETED (409) +
   job CLOSED, message participant rules, review rules (duplicate 409, range 400,
   non-participant 403), readback both review directions.
4. Search/sort via backend query params: title/description search case-insensitive,
   budget asc — PASS. Deadline desc — PASS standalone; limitation documented: equal
   deadline timestamps can reorder between loads (no secondary sort key; ties have
   unspecified order; NOT a defect).
5. Persistence: survives refresh, logout/login, AND backend restart (old users
   authenticate; S11 job CLOSED; projects + chat history intact). No mock data in
   frontend (code audit).
6. Browser E2E after restart: landing (light theme), Messages→Chat deep link, STOMP send
   delivered post-restart, project reviewed state + no lifecycle buttons, profile 4.5/5
   attribution, 404 route, protected-route redirect, anonymous job detail (no owner
   actions), console ZERO errors, network clean.
7. Responsive functional: 420px marketplace (16 cards, no overflow), project detail
   usable, redirects work.
8. Security sanity: .gitignore covers .env/node_modules/target/dist; git tracks no .env;
   application.properties uses env placeholders; test props H2+test secret; authz is
   backend-enforced (proven, not assumed).

**Backend convention documented (not a bug):** non-owner/non-participant READ denials on
job proposals / offers surface as 409 (BusinessRuleException) while WRITE denials use
403 — frontend already treats both as denial.

**Known limitations (all pre-existing, documented):** deadline sort tie ordering;
GET /api/users/{id}/reviews requires JWT; login with nonexistent email returns 500;
repository has no initial commit (everything untracked on main) — committing is the
user's call.

**Files changed in Step 11: NONE** (temp audit scripts under .freebuff/ were removed).

**STEP 12 READINESS: READY.**

## Step 10 Session — Landing Page + Light Theme COMPLETE

**Step 10 status: FINAL PASS.** Landing page built from the user-provided Mayora reference
image; whole-app theme flipped to the Mayora-inspired light/red system via design tokens.
Backend untouched.

**Reference adherence (Mayora composition -> DEVLINK identity, zero Mayora branding):**
- Hero: pill badges row -> two-line headline (dark line 1, red line 2) -> white card with
  red left-border accent -> red pill CTA + outline CTA -> 3 white mini-cards with red
  icons -> deep-red gradient banner with white pill button.
- Then: How It Works (7-step real flow), For Clients / For Freelancers (real capability
  checklists), Features (6 real features), Final red CTA section, Footer (real routes).
- No fake statistics anywhere. CTA labels/routes are role- and auth-aware.

**Files created:**
- frontend/src/pages/landing/LandingPage.jsx

**Files modified:**
- frontend/src/App.jsx — "/" now renders LandingPage (PlaceholderPage gone from "/").
- frontend/src/index.css — THEME FLIP (Tailwind v4 @theme): background #fdf4f2, surface
  #ffffff, surface-elevated #faedeb, border #f2dfd9, primary #d91e2e (hover #b3121f),
  text #241414 / #8c7370; devlink-fade-up entrance animation utilities. Every page that
  consumes tokens is recolored by this single change (user explicitly requested the
  colors change on every page).
- 13 files swept: hardcoded #8F1D2C/#A82738/rgba(143,29,44,*) -> var(--color-primary)/
  var(--color-primary-hover)/rgba(217,30,46,*) in ProjectDetail, JobDetail, JobEdit,
  JobCreate, ProposalList, ProposalDetail, ProfilePage, MessagesPage, ChatPage,
  JobFilters, JobMarketplace, JobCard, ProjectList, ReviewSection; Spinner.jsx recolored
  to primary (was text-blue-600); ErrorState.jsx recolored to token-based danger tint.
- Navbar.jsx: REUSED, untouched (landing integrates with the existing Navbar).

**Browser E2E (real browser, localhost:5173):**
- TEST A anonymous PASS: real landing (no placeholder/Test Toast), anon CTAs
  Get Started Free -> /register + Browse Projects -> /jobs, footer Log In/Sign Up.
- TEST B client PASS: hero "Post a Job" -> /jobs/create, "Open Messages" -> /messages,
  banner "Go to Projects" -> /projects; no role leaks.
- TEST C freelancer PASS: hero "Find a Project" -> /jobs; ZERO /jobs/create links
  (found and fixed 2 role-gating leaks during E2E: clients-card CTA now "Explore
  Marketplace" -> /jobs; footer link now "Find Work" -> /jobs for freelancers).
- TEST D mobile (420px) PASS: no horizontal overflow; hamburger menu lists all nav items
  incl. Messages; footer text/nav verified after scroll (initially "not visible" only
  because the viewport was at the top of a 3747px page).
- TEST E regression PASS: Messages -> Chat (message from Step 9 persisted, connection
  Live); Project detail Completed + "You reviewed" state; Profile 5.0 + "Reviewed by
  S5 Client" + stars; marketplace 10 cards with readable dark-on-light rendering;
  AuthOnlyRoute redirect intact; console clean (only Vite HMR logs).

**Code quality:**
- pnpm lint: PASS — 0 errors, 11 warnings (the exact pre-existing Step 9 set; all 6
  warnings introduced by landing code were fixed during the session: 5 unused lucide
  imports + 1 duplicate borderLeft key).
- pnpm build: PASS (447.30 kB bundle).
- Backend: unchanged — no tests re-run.

**Known limitations (documented):**
- Per-section entrance animation is CSS-only and non-blocking; no scroll-triggered
  observers (kept deliberately simple per Step 10 scope).
- The light theme now applies to ALL pages via tokens; pages retain their Step 3–9
  layouts/structure (full per-page visual polish belongs to Step 12, not done).
- Login/Register pages were not individually restyled beyond the token flip (explicitly
  out of scope; reserved for Step 12).

## Step 9 Session — Integrated Navigation & Cross-Feature UX COMPLETE

**Step 9 status: FINAL PASS.** One real gap fixed (top-level Messages access); backend
left UNTOUCHED. All verification via REST plus REAL browser E2E (TEST A–H).

**Backend contract (audited, not guessed):**
- NO global conversation-list endpoint exists (and none was invented, per scope).
- Real inbox assembled client-side from EXISTING endpoints: freelancer uses
  GET /api/proposals/me; client uses GET /api/jobs (JobDto has clientId) then per-job
  GET /api/jobs/{id}/proposals (owner-only; failures contribute no conversations).
- NOTE: /api/proposals/me returns 200 for clients but always an empty list (a client is
  never a freelancerId) — harmless, but the inbox calls it only for freelancers.

**Files created:**
- frontend/src/services/conversationService.js — role-aware conversation assembly,
  dedup by proposal id, sorted by last activity; maps to the existing /chat/:proposalId
  route and STOMP topic. Zero fake data.
- frontend/src/pages/messages/MessagesPage.jsx — inbox with role-aware empty states,
  loading/error states, status badges, counterparty attribution, relative timestamps,
  deep links into the existing ChatPage.

**Files modified:**
- frontend/src/App.jsx — added /messages route (AppLayout).
- frontend/src/components/layout/Navbar.jsx — "Messages" nav item (desktop + mobile),
  MessagesSquare icon; no theme/layout redesign.

**Browser E2E (real browser, existing S5 test data):**
- TEST A client PASS: /messages lists 2 real conversations (Flow A/B jobs, Accepted
  badges, "Chat with S5 Freelancer · You are the client"); deep link opens ChatPage;
  sent "Step 9 integration check: client message from Messages inbox" via STOMP —
  bubble rendered, input cleared, connection Live.
- TEST B freelancer PASS: 2 conversations, "You are the freelancer"; client's message
  visible with sender "S5 Client"; chat Live.
- TEST C proposal->chat PASS: ProposalDetail Open Chat href correct.
- TEST D project->review->profile PASS: completed project shows reviewed state;
  profile shows 5.0/5 (freelancer) / 4.5/5 (client) with correct attribution; View
  project link round-trips; review persists after reload.
- TEST E empty profile PASS: outsider profile shows "No reviews yet", no fake count,
  no crash.
- TEST F authorization PASS: outsider denied on others' project ("Access restricted",
  no price/review data), proposal ("Could not load proposal — You do not have
  permission to view offers"), chat (clean wall, no socket data), inbox ("No
  conversations yet", no leakage).
- TEST G persistence PASS: inbox + message persist across reload and logout/login;
  signed-out /messages redirects to /login.
- TEST H responsive PASS: mobile menu lists Messages between My Proposals and Projects;
  navigation works; no horizontal overflow.

**Regression (Steps 1–8): PASS** — marketplace 10 cards + backend search/sort verified;
Post a Job reachable for client only; job detail owner view (proposals + edit/delete);
proposal detail Accepted with offer history, no accept/reject on terminal proposals,
Open Chat present; projects list (2 Completed); profile reputation correct; unknown
routes render the 404 page without crashing; console clean (only Vite HMR logs).

**PostgreSQL connection exhaustion (prior session) — diagnosed, no code change:**
- Exactly ONE Spring Boot process (single listener on :8080); one Vite on :5173.
- Backend healthy: login + DB reads 200; pool verified stable under a 12x burst.
- Root cause: accumulated state from the prior session (browser E2E sockets + a
  previously restarted backend). Recovered by the app restart itself; no config,
  architecture, or data changes were made. All test data preserved.

**Code quality:**
- pnpm lint: PASS — 0 errors, 11 warnings (10 pre-existing + 1 new set-state-in-effect
  in MessagesPage.jsx matching the established data-load pattern; unused-catch warning
  in new code was fixed during the session).
- pnpm build: PASS (428.61 kB bundle).
- Backend: unchanged — no tests re-run (last verified 65/65 in Step 6).

**Known limitations (documented):**
- The inbox is a client-side assembly of existing endpoints, not a server-side
  conversation index: it reflects proposal activity (updatedAt), not per-thread
  unread counts or message previews — those would require a backend endpoint that
  does not exist (intentionally not invented in Step 9).
- Client inbox does one request per owned job (N+1) — fine at current scale
  (~10 jobs); a dedicated endpoint would be the future optimization if ever needed.

## Step 8 Session — Profile UI COMPLETE

**Step 8 status: FINAL PASS.** Backend profile contract audited from source; backend left
UNTOUCHED. All verification via REST against the live backend plus REAL browser E2E.

**Backend contract (audited, not guessed):**
- DISCREPANCY REPORTED: docs/architecture.md §11 lists GET /api/users/{userId}/profile, but
  no UserController/UserService exists in the backend — that endpoint was never implemented.
  Per the architecture lock, the backend was NOT modified to add it.
- Available: GET /api/auth/me -> UserDto {id, name, email, role, bio, skills, avatarUrl}
  (AuthProvider already loads this into the auth context).
- GET /api/users/{userId}/reviews (in ReviewController) — requires JWT in practice
  (401 without token, live-verified; the documented Step 7 quirk persists). api.js attaches
  the token automatically, so authenticated profile viewing works normally.
- No profile-edit endpoint -> Profile is READ-ONLY by design (no edit UI implemented).
- No backend rating-aggregation endpoint -> the average rating shown is a display-only
  frontend computation from raw backend reviews (backend remains authoritative for data).

**Files created:**
- frontend/src/pages/profile/ProfilePage.jsx — header (avatar initial/avatarUrl, name, role
  badge, email, bio or empty state, skills chips or empty state), reputation panel (avg
  X.Y/5 + stars + "N reviews received" or "No reviews yet"), reviews-received list with
  reviewer->reviewee attribution + date + View project link, loading/error/empty states,
  Refresh profile action. Identity solely from auth context; reviews via existing
  reviewService — NO new userService created (equivalent already existed), no new deps.

**Files modified:**
- frontend/src/App.jsx — /profile/:id placeholder replaced with ProfilePage; added /profile
  route (both inside AppLayout; the page itself redirects to /login when unauthenticated).
- frontend/src/components/layout/Navbar.jsx — user chip (desktop + mobile) is now a Link
  to /profile. No theme/layout redesign.

**Browser E2E (real browser, localhost:5173, S5 test accounts with real Step 7 review data):**
- TEST A freelancer profile PASS: header (name/role/email, "No bio yet", React skill chip),
  5.0/5 average from 1 review, review card with CORRECT attribution ("Reviewed by S5
  Client", 5 stars, comment, date, View project link). Navbar chip click navigates to
  /profile; /profile/<own-id> renders the same profile.
- TEST B other-user boundary PASS: /profile/<different-id> -> clean "Profile not available"
  state; backend returns [] for unknown user ids (product boundary, not an error mask).
- TEST C empty state PASS: Chat Client (no reviews) -> "No reviews yet / Reputation appears
  after completed projects." Zero fabricated data.
- TEST D aggregation PASS: S5 Client -> 4.5/5 from exactly the two Step 7 reviews (5+4);
  "2 reviews received"; screenshot evidence captured; state persists after real reload.
- Responsive PASS: mobile-width rendering verified via screenshot (no horizontal overflow).

**Regression (Steps 1–7): PASS** — marketplace (11 job cards), job detail, projects list
(2 completed projects), project detail (Completed badge, reviewed state, View Job/View
Proposal), proposal detail (Accepted + offer history + Open Chat), chat page (Live
connection + composer), console clean (only Vite HMR logs).

**Code quality:**
- pnpm lint: PASS — 0 errors, 10 warnings (9 pre-existing + 1 new set-state-in-effect in
  ProfilePage.jsx matching the established data-load pattern used by ProposalList/
  ProjectList/ReviewSection). A preserve-manual-memoization warning in new code was fixed
  during the session by depending on a primitive (profileId).
- pnpm build: PASS (422.52 kB bundle).
- Backend: unchanged — no tests re-run (last verified 65/65 in Step 6).

**API/runtime results:**
- /api/auth/me -> full UserDto incl. bio/skills/email for both roles.
- /api/users/{freelancerId}/reviews -> 200 with the Step 7 review, correct reviewer->reviewee.
- /api/users/{clientId}/reviews -> 200 with 2 reviews (5, 4) matching Step 7 records.
- No token -> 401 (quirk live-confirmed); unknown userId -> 200 [] (clean empty state).

**Data cleanup:** No new test data created this session (reused existing S5/Step 7 data).
Protected smoke-test records untouched.

**Known limitations (documented):**
- Other-user public profiles are not supported: the backend exposes no user-profile
  endpoint. If a future step adds GET /api/users/{userId}/profile to the backend, the
  /profile/:id route is ready to render it.
- Profile is read-only (no backend edit endpoint exists).
- GET /api/users/{userId}/reviews requires JWT (documented quirk); anonymous profile
  viewing is therefore not possible without a backend security change (out of scope).

### Backend
- All foundational modules (Langkah 1–10) are FINAL PASS and locked.
- `JobDto` has been properly enhanced to include `deadline`, `createdAt`, and `clientName`.
- **BUG FIX APPLIED:**
  - `AuthServiceImpl.getCurrentUser()` now loads user fresh from database within transaction
  - Fixes LazyInitializationException when accessing lazy-loaded `User.skills` collection
  - All 65 backend tests PASS

### Frontend
- Step 1 (Visual Foundation): FINAL PASS.
- Step 2 (Authentication): FINAL PASS. Real E2E verified with backend. CORS fixed via Vite proxy.
- Step 3 (Job Marketplace): FUNCTIONAL PASS / VISUAL PENDING / RUNTIME BUG FIXED.

## Frontend Step 3 — Bug Fix Session Summary

**Runtime bug identified and fixed:**

### BUG — Authentication state lost on page load
**Root cause:**
`AuthServiceImpl.getCurrentUser()` tried to access lazy-loaded `User.skills` collection outside the transaction boundary. This caused a `LazyInitializationException`, resulting in a 500 Internal Server Error from `GET /api/auth/me`.

**Evidence:**
- `JwtAuthFilter` loads user in one transaction context
- `getCurrentUser()` called after login tries to access `user.getSkills()` 
- Hibernate session already closed → `LazyInitializationException`
- Frontend `fetchUser()` catches 500 error, `userData` never set → `user` remains `null`

**Fix:**
Changed `AuthServiceImpl.getCurrentUser()` to load user fresh from database:
```java
CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
User user = userRepository.findById(userDetails.getId())
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
return convertToDto(user);
```

**Result:**
- User loaded within new transaction boundary
- Lazy collection properly initialized
- No more 500 error from `/api/auth/me`
- Auth state correctly preserved across page loads

**Files modified:**
- `backend/src/main/java/com/devlink/backend/service/impl/AuthServiceImpl.java` (lines 96-97)

**Code quality:**
- Backend compile: PASS
- Backend tests: PASS (65/65, 0 failures, 0 errors)
- Frontend lint: PASS (0 errors, 0 warnings)
- Frontend build: PASS (1.50s)

## Step 4 Final Session — Proposal & Negotiation COMPLETE

**Step 4 status: FINAL PASS.** Verified on three levels: code review, API/runtime against the
live backend, and a REAL browser E2E run through the running Vite app (not source inspection).

**Supported negotiation flow (per backend rules, now fully exposed in the UI):**
1. Freelancer submits proposal -> initial offer by FREELANCER (PENDING).
2. While an offer is PENDING, ONLY its recipient may respond: Counter, Accept, or Reject.
   The creator sees NO offer actions until the recipient responds (backend enforces this;
   the UI no longer shows buttons the backend would reject).
3. A recipient counter supersedes the PENDING offer and creates a new PENDING offer by the countering party.
4. Reject leaves the proposal NEGOTIATING; both parties may then open a new offer.
5. Accept by the recipient runs the acceptance transaction: offer ACCEPTED, proposal ACCEPTED,
   exactly one Project created, job IN_PROGRESS, competing proposals rejected.

**Bugs fixed this session (all in frontend/src/pages/proposals/ProposalDetail.jsx):**
1. "Accept Proposal" sent offerId null -> POST /offers/null/accept -> HTTP 400. Now resolves the latest PENDING offer id.
2. Creator-side "Counter" on own PENDING offer shown, but backend rejects creator offers (recipient-only rule). Button removed; creator sees no offer actions while pending.
3. Recipient-side Counter affordance was missing. Added (backend allows recipient counters).
4. Bottom-bar "Counter-Offer" shown regardless of pending state. Now gated by canCreateOffer = (isPending || isNegotiating) && (!pendingOffer || isRecipientOfPending).
5. handleCreateOffer optimistically prepended the new offer and never refreshed; previous PENDING offer stayed visible as PENDING and proposal status was stale. Now refetches proposal + offers after creation.
6. Removed duplicate unreachable `if (loading)` block (dead code cleanup, no behavior change).

**Browser E2E — exact flow performed (REAL browser run against localhost:5173 + backend :8080):**
Test identities created fresh via API (password password123):
- CLIENT: e2e-client-1788973564673@test.dev
- FREELANCER: e2e-freelancer-1788973564673@test.dev

A. CLIENT
 1. Login PASS (redirect /jobs, toast, role shown in navbar)
 2. Created job "Step4 Final E2E Job" (3200 USD, 2026-09-30, React) via Post a Job form PASS (id d541dce1-9afc-4a57-a086-ba51fd440a7d)
 3. Job appears in marketplace listing (OPEN, 3,200, E2E Client) PASS
 4. Logout PASS (redirect home)
B. FREELANCER
 5. Login PASS; "Post a Job" NOT shown PASS
 6. Opened the test job; only "Submit Proposal" visible (no Edit/Delete) PASS
 7. Submitted proposal 3000/21d PASS (id 070cec4d-f168-420f-8e75-df5df71e4fd3)
 8. "Proposal Submitted" card + "View Proposal" link appear PASS
 9. Not withdrawn PASS
10. Logout PASS
C. CLIENT
11. Login; job detail shows the freelancer proposal PASS
12. Proposal Detail: initial offer "E2E Freelancer / Pending / 3,000 / 21d" visible PASS
13. Client created Counter-Offer 2800/18d PASS
14. After counter: new offer CLIENT PENDING; previous FREELANCER offer SUPERSEDED; proposal NEGOTIATING PASS
15. Client sees NO Accept/Reject/Counter on own PENDING offer (zero action buttons) PASS
16. Logout PASS
D. FREELANCER
17. Proposal Detail: client counter-offer (PENDING, 2800/18d) visible PASS
18. Freelancer sees Counter + Reject + Accept on client's PENDING offer PASS
19. Accept confirm modal opens ("Are you sure you want to accept this offer?"); CANCELLED PASS
20. Freelancer created Counter-Offer 2900/19d PASS
21. After counter: client offer SUPERSEDED; freelancer offer PENDING; freelancer (creator) sees NO actions on it PASS
22. Logout PASS
E. FINAL ACCEPTANCE
23. Client login (recipient of final PENDING offer) PASS
24. Clicked Accept -> confirm modal -> Yes, Accept PASS
25. Proposal becomes ACCEPTED; accepted offer (2900/19d) ACCEPTED; earlier offers preserved as history (SUPERSEDED x2) PASS
26. Exactly ONE Project created: status IN_PROGRESS, agreedPrice 2900, agreedDurationDays 19 (verified via GET /api/projects with browser session token) PASS
27. Job status IN_PROGRESS (verified via GET /api/jobs/{id}) PASS

**Verification results (this session):**
- Code verification: PASS (all six fixes reviewed in ProposalDetail.jsx)
- Frontend lint: PASS (0 errors, 6 pre-existing warnings, unchanged)
- Frontend build: PASS (vite build)
- Backend: unchanged — no backend tests/build re-run
- API/runtime: PASS (full negotiate + accept cycle verified earlier via Node fetch script)
- Browser E2E: PASS (real browser run; steps listed above)

**Data cleanup:** E2E accounts/job/proposal/project intentionally left in DB (no user-delete
endpoint; job is IN_PROGRESS so backend rules correctly block job deletion; no destructive
cleanup performed). Does not affect the protected persistence smoke-test records.

**Intentionally unsupported (by backend design, documented):**
- Creator of a PENDING offer cannot counter/accept/reject it until the recipient responds (recipient-only rule).
- Reject on an offer does NOT finalize the proposal; it stays NEGOTIATING so a new offer can be opened by either party.

## Earlier Step 4 Session — Proposal & Negotiation

**Issue verified:** Accept/Reject visibility for PENDING ProposalOffers.

**Result: the visibility logic is CORRECT — no change needed there.**
The condition `offer.status === 'PENDING' && offer.offeredById !== user?.id` in
`frontend/src/pages/proposals/ProposalDetail.jsx` behaves as required:
- Creator of a PENDING offer does NOT see Accept/Reject (verified for CLIENT creator of a counter-offer).
- Recipient of a PENDING offer DOES see Accept/Reject (verified for FREELANCER recipient).

**Data contract verified against the running backend (API/runtime):**
- `GET /api/proposals/{id}/offers` returns `offeredById` (UUID string of the offer creator),
  `status` exactly `"PENDING"`, `offeredByName`, price, duration, message, createdAt.
- `GET /api/auth/me` (used by AuthProvider to populate `user`) returns `id` as the same UUID string.
- Initial proposal flow: freelancer submits -> initial offer by FREELANCER (PENDING).
  Client counter -> initial offer SUPERSEDED, new offer by CLIENT (PENDING), proposal NEGOTIATING.

**Real bug found and fixed:**
- Client's bottom "Accept Proposal" button (initial PENDING proposal) passed `offerId: null`,
  producing `POST /api/proposals/{id}/offers/null/accept` -> HTTP 400 "Invalid parameter type: offerId".
- Fix (smallest change, `ProposalDetail.jsx`): the button now resolves the latest PENDING offer
  from the loaded offers list and passes its real id to the confirm modal.

**Accept flow verified via API after fix:**
`POST /api/proposals/{id}/offers/{offerId}/accept` -> HTTP 200; proposal ACCEPTED;
exactly one Project created; job IN_PROGRESS; competing proposals rejected.

**Verification results (this session):**
- Frontend lint: PASS (0 errors, 6 pre-existing warnings)
- Frontend build: PASS
- Backend unchanged — no backend tests re-run
- API/runtime: PASS (full client/freelancer negotiate + accept cycle against live backend)
- Browser E2E: NOT PERFORMED (no browser test was run; do not claim PASS)

**Known gaps in negotiation UI (not fixed — out of scope for this session):**
- Freelancer (recipient) has no "Counter" affordance on a received PENDING offer — only Accept/Reject.
- The "Counter" button shown to the creator of their own PENDING offer always fails backend
  validation (recipient-only rule) until the recipient responds.
- Minor: duplicate unreachable `if (loading)` block inside ProposalDetail.jsx (dead code).

## Step 7 Session — Review & Rating UI COMPLETE

**Step 7 status: FINAL PASS.** Backend Review implementation audited from source — correct
per architecture rules — and left UNTOUCHED. All verification via REST against the live
backend plus REAL browser E2E (preview browser + API-driven second sessions).

**Backend contract (audited, not guessed):**
- POST /api/projects/{projectId}/reviews body {rating: 1-5, comment?} -> 201.
  COMPLETED-only (BusinessRuleException -> 409); reviewer must be a participant
  (AccessDeniedException -> 403); reviewee is ALWAYS the other participant
  (self-review structurally impossible); duplicate (project+reviewer+reviewee) -> 409.
- GET /api/projects/{projectId}/reviews -> participant-only (403 outsider), DESC order.
- GET /api/users/{userId}/reviews -> service layer intends public, but Spring Security
  still requires a valid JWT (401 without). Documented quirk for the future Profile UI.
- ReviewResponse: id, projectId, reviewerId/Name, revieweeId/Name, rating, comment, createdAt.
- ReviewRequest: @NotNull @Min(1) @Max(5) rating; comment optional.

**Files created:**
- frontend/src/services/reviewService.js (createReview / getProjectReviews / getUserReviews)
- frontend/src/components/projects/ReviewStars.jsx (interactive 1-5 stars: radiogroup ARIA
  roles, aria-checked, keyboard operable, click-selected-star to clear, amber fill, disabled
  while submitting; read-only mode for lists)
- frontend/src/components/projects/ReviewSection.jsx (existing reviews list with
  reviewer->reviewee attribution + date; eligibility-aware form; "You reviewed X" state;
  unlock hint on non-COMPLETED; friendly 400/401/403/409 handling; refresh from backend
  after submit — no browser reload)

**Files modified:**
- frontend/src/pages/projects/ProjectDetail.jsx ONLY (added ReviewSection at the bottom;
  one import + one JSX block). No theme/layout/navbar changes.

**API negative matrix (real backend responses):**
- rating 0 / 6 / null / -1 / 99 -> 400 with field details
- outsider POST -> 403 "Only project participants can submit a review"
- outsider GET reviews -> 403
- POST on IN_PROGRESS project -> 409 "Reviews can only be submitted for COMPLETED projects"
- duplicate review -> 409 "You have already reviewed this user for this project"
- mutual: client->freelancer 201 (5), freelancer->client 201 (4); read-back 200

**Browser E2E (TEST A-F): PASS**
- TEST A: freelancer on COMPLETED project A: review section + 5-star radiogroup + form;
  submit disabled until rating+comment; selected stars clearly highlighted (aria-checked);
  submitted -> "You reviewed S5 Client — Your rating: 5/5" state, review visible in list
  immediately (no reload); browser refresh -> review persisted, still no second form.
  Screenshot evidence captured.
- TEST B: second submission impossible in UI (form replaced by reviewed state);
  direct API duplicate -> 409 with clean toast mapping in ReviewSection.
- TEST C: IN_PROGRESS project (Step4 project): "Reviews unlock when the project is
  completed" hint; NO form/stars/textarea rendered; API POST -> 409.
- TEST D: outsider opens completed project: project-level 403 wall ("Access restricted",
  "You are not a participant of this project") — zero review data leak.
- TEST E: no rating -> submit disabled; whitespace-only comment -> submit disabled
  (never sent); API range abuse (0/6/-1/99) all 400.
- TEST F: both directions reviewed via API seed + rendered in UI (screenshot shows both
  reviews with correct reviewer->reviewee and 5-star fills).

**Regression (Steps 1–6): PASS** — login/logout; marketplace (10 job cards incl. all
prior-stage data); job detail; proposal detail with Open Chat; chat loads history (8
bubbles) with Live connection; projects list correct empty state for a non-participant
account; auth/me works. Console clean (only Vite HMR logs + expected 409 from a deliberate
duplicate-review negative test).

**Code quality:**
- pnpm lint: PASS — 0 errors, 9 warnings (8 pre-existing + 1 new set-state-in-effect in
  ReviewSection.jsx following the same data-load pattern as ProposalList/ProjectList;
  unused-import warnings in new code were fixed during the session)
- pnpm build: PASS (414.95 kB bundle)
- Backend: NOT changed — no tests re-run (last verified 65/65 in Step 6)

**Data cleanup:** Step 7 test data left in DB: 2 reviews on the two COMPLETED S5 projects
(client->freelancer 5*, freelancer->client 4*), 1 outsider account. No delete endpoints
exist for reviews; no destructive cleanup; protected smoke-test records untouched.

**Known limitations:**
- GET /api/users/{userId}/reviews needs a JWT in practice (Spring Security default on
  /api/**) — the future Profile UI must send the token (or the backend would need an
  explicit permitAll, which is out of scope).
- Project-level reviews are participant-only by design; the public Profile page is the
  intended place for reputation display.

## Step 6 Session — Real-Time Chat UI COMPLETE

**Step 6 status: FINAL PASS** — CODE PASS + REST API PASS + WEBSOCKET PASS + BROWSER
REAL-TIME PASS (two authenticated sessions, no refresh) + authorization + lifecycle +
persistence + regression.

**Backend contract (inspected from source, NOT guessed):**
- REST: GET /api/proposals/{id}/messages -> List<MessageResponse> (chronological ASC,
  participant-only); POST same path {content} -> 201 (persists, does NOT broadcast).
- MessageResponse: id (UUID — used as the stable dedup key), proposalId, senderId,
  senderName, content, createdAt.
- WS/STOMP: endpoint /ws is a NATIVE WebSocket (no SockJS); CONNECT requires native header
  `Authorization: Bearer <JWT>` (WebSocketSecurityInterceptor); SUBSCRIBE to
  /topic/proposals/{id} is participant-validated; sending is via STOMP app destination
  /app/proposals/{id}/messages with {content}; ChatController persists then broadcasts
  MessageResponse to the topic (including back to the sender).

**Files created:**
- frontend/src/services/messageService.js (getMessages/sendMessage via existing api.js)
- frontend/src/services/stompClient.js (native WebSocket + Bearer CONNECT, reconnect 5s)
- frontend/src/hooks/useProposalChat.js (REST history -> STOMP connect -> single
  subscription, UUID dedup, cleanup on unmount, retry, 4 connection states)
- frontend/src/pages/chat/ChatPage.jsx (full chat UI: header + context, Live/Connecting/
  Disconnected/Error badge, day separators, own vs other bubbles, near-bottom-only
  autoscroll, Enter-to-send, empty/disabled composer states, error banners, no fake status)

**Files modified:**
- frontend/package.json + pnpm-lock.yaml (added @stomp/stompjs 7.3.0 — only dependency)
- frontend/vite.config.js (added /ws proxy, ws: true)
- frontend/src/App.jsx (replaced /chat placeholder with /chat/:proposalId -> ChatPage)
- frontend/src/pages/proposals/ProposalDetail.jsx ("Open Chat" button in Offer History
  header, shown for PENDING/NEGOTIATING/ACCEPTED — chat survives acceptance per backend)
- **BACKEND (evidence-based minimal fix):**
  backend/src/main/java/com/devlink/backend/controller/ChatController.java — added @Valid
  to the @Payload MessageRequest param. Defect: the STOMP send path persisted and broadcast
  whitespace-only messages (REST path rejected them via @Valid). Violated §23. Fix verified:
  compile PASS, 65/65 backend tests PASS (incl. 5 WebSocket integration tests), backend
  restarted via `mvnw spring-boot:run` (backend/.env supplies DB_URL/JWT_SECRET), and the
  live whitespace STOMP send is now rejected with no broadcast. NOTE: the dev server was
  restarted by this session; backend now runs from this shell (PID may differ).

**REST API results:**
- Seed: 2 messages via POST -> 201; history order client->freelancer (chronological).
- outsider GET/POST messages -> 403 "Only proposal participants can access this chat"
- whitespace content POST -> 400 with field details; empty content -> 400
- invalid token / no token -> 401; participant GET -> 200
- accepted proposal chat access (Step 4 proposal) -> 200 (chat continues after ACCEPTED)

**WEBSOCKET results (protocol level, through the Vite /ws proxy):**
- CONNECT with Bearer -> CONNECTED; SUBSCRIBE -> OK; SEND -> MESSAGE broadcast received
  with persisted UUID + sender name. Unauthorized CONNECT -> STOMP ERROR frame.

**Browser E2E — exact flows performed (real browser, localhost:5173):**
Seed data: chat-client-1788978346462@test.dev / chat-freelancer-1788978346462@test.dev
(password password123), proposal b4d98b6f-5d7e-443a-a096-60bf2db78797, 2 REST-seeded messages.

FLOW A — OPEN CHAT (Browser A = Client): PASS
- Login -> proposal detail -> "Open Chat" -> /chat/{proposalId}; header shows job title +
  "Chat with Chat Freelancer"; history (3 msgs incl. earlier protocol test) in order;
  connection badge reaches "Live".

FLOW B — REAL-TIME CLIENT -> FREELANCER: PASS
- Second authenticated freelancer session (STOMP listener subscribed to the same topic).
- Client typed "Realtime test CLIENT 001" in the browser and clicked Send.
- Freelancer session received the broadcast automatically: no refresh, correct sender
  "Chat Client", persisted UUID. Client browser: bubble appears once, input cleared.

FLOW C — REAL-TIME FREELANCER -> CLIENT: PASS
- Freelancer session sent "Realtime test FREELANCER 001" via STOMP.
- Client browser received it WITHOUT any refresh/navigation/refetch — bubble rendered
  automatically, exactly once, connection still "Live".

FLOW D — HISTORY PERSISTENCE: PASS
- Full page reload of the chat: all 5 messages from backend, chronological, zero
  duplicates, reconnects to "Live".

FLOW E — NAVIGATION/LIFECYCLE: PASS
- Proposal -> Chat -> back -> Chat again; sent "Lifecycle dedup check 001" after remount:
  rendered exactly once on both paths (UUID dedup); no duplicate subscriptions; console
  clean (only Vite HMR logs, no React/WS errors).

FLOW F — AUTHORIZATION: PASS
- Non-participant (fresh outsider account) opens /chat/{others-proposal}: full-page clean
  "Could not open chat — You do not have permission to view this proposal"; NO message
  data rendered; no socket opened for unauthorized chat.
- Invalid token: AuthProvider clears it and redirects to /login; no data exposure.

**Negative tests:**
- Empty message: Send button disabled.
- Whitespace-only: Send disabled; direct STOMP whitespace send -> backend rejects
  (post-fix verification, no broadcast, nothing persisted).
- Duplicate Send clicks: guarded (disabled while sending + sending flag).
- Reopen/reconnect: no duplicate messages (UUID dedup), single subscription per mount.
- Invalid/absent token: 401 -> clean UI states.
- Accepted-proposal chat in browser: Step 4 accepted proposal chat opens, connected,
  message sent and rendered once ("Post-acceptance chat check").

**Regression (Steps 1–5): PASS**
- Login/logout; marketplace lists all prior-stage data (S4/S5 jobs with Closed/In Progress
  states intact); proposal detail (PENDING) with offer history + Open Chat; /projects page
  renders correct empty state for a fresh account (API confirmed 0 projects for that user —
  participants still see their projects from the same backend); Step 4 client's accepted
  proposal chat works post-acceptance.

**Code quality:**
- pnpm lint: PASS — 0 errors, 8 warnings (identical set to pre-Step-6; new-code warnings
  were fixed during the session: unused imports/vars removed, exhaustive-deps handled with
  a documented identity-based deps comment)
- pnpm build: PASS (407.85 kB bundle incl. stompjs)
- Backend: compile PASS, 65/65 tests PASS, build SUCCESS (after the @Valid fix)

**Data cleanup:** Step 6 test data left in DB (3+ test accounts, job "S6 Chat E2E Job",
proposal b4d98b6f-..., 9 messages incl. test/verification messages, one whitespace-only
message persisted by the PRE-FIX backend as evidence). No delete endpoints exist for
messages; no destructive cleanup performed; protected smoke-test records untouched.

**Known limitations (documented, acceptable):**
- REST POST /messages persists but does not broadcast (backend design); the UI therefore
  sends exclusively via STOMP, which is the backend's real-time path — both paths stay
  validated (@Valid fix).
- Sending is enabled only while the socket is CONNECTED (backend has no REST->broadcast,
  so sending during a socket outage would not reach the other party). A Retry button and
  clear banners cover reconnects (stompjs auto-reconnects every 5s).
- Login with a NONEXISTENT email returns 500 instead of 401 (backend BadCredentials
  handling from earlier stages — pre-existing, outside Step 6 scope; wrong PASSWORD for an
  existing account was not re-tested this session).

## Step 5 Session — Project UI & Lifecycle COMPLETE

**Step 5 status: FINAL PASS.** Verified at three levels: code, API/runtime, and a REAL
browser E2E run through the running Vite app.

**Backend contract used (verified from source, NOT guessed):**
- `GET /api/projects` — projects where current user is client or freelancer participant.
- `GET /api/projects/{id}` — participant-only (403 otherwise), 404 if missing.
- `POST /api/projects/{id}/status` body `{ "status": "SUBMITTED|REVISION|COMPLETED" }`
  → returns updated ProjectDto. Completion also sets completedAt and Job -> CLOSED transactionally.
- ProjectDto fields: id, proposalId, jobId, jobTitle, clientId, clientName, freelancerId,
  freelancerName, agreedPrice, agreedDurationDays, title, deadline, status, startedAt,
  completedAt, createdAt, updatedAt.
- Transition matrix (backend-enforced): IN_PROGRESS->SUBMITTED (freelancer only, else 403),
  REVISION->SUBMITTED (freelancer only, else 403), SUBMITTED->REVISION (client only, else 403),
  SUBMITTED->COMPLETED (client only, else 403), everything else 409. Invalid status value 409.

**Files created:**
- frontend/src/services/projectService.js
- frontend/src/components/projects/ProjectStatusBadge.jsx
- frontend/src/components/projects/ProjectCard.jsx
- frontend/src/components/projects/projectFormat.js (formatBudget/formatDate helpers)
- frontend/src/pages/projects/ProjectList.jsx
- frontend/src/pages/projects/ProjectDetail.jsx

**Files modified:**
- frontend/src/App.jsx (replaced the two project PlaceholderPage routes; nothing else)

**Features implemented:**
- /projects: protected list; loading/error/empty states; cards with job title, status badge,
  agreed price, duration, participants, start date; navigation to detail; all data from backend.
- /projects/:id: protected detail; full ProjectDto display (price, duration, deadline,
  client/freelancer, timestamps); links to job and proposal; 404/403 handled with dedicated
  error states; role/state-based action panel with confirmation modals:
  Freelancer: Submit Work (IN_PROGRESS) / Submit Revision (REVISION).
  Client: Request Revision + Complete Project (SUBMITTED only).
  COMPLETED: read-only panel, no lifecycle buttons for anyone.
- No page requires a manual reload after a transition: state updates from the authoritative
  backend response (and on error, state is refetched so the UI never lies).

**API negative checks (real backend responses):**
- client SUBMIT while IN_PROGRESS -> 403 "Only freelancer can submit project"
- freelancer COMPLETED while IN_PROGRESS -> 409 "Invalid status transition ..."
- freelancer REVISION while IN_PROGRESS -> 409
- freelancer status "SUBMIT" -> 409 "Invalid project status: SUBMIT"
- outsider GET detail -> 403 "You do not have permission to access this project"
- outsider POST status -> 403
- participant GET after failed attempts -> 200, status unchanged (IN_PROGRESS)

**Browser E2E — exact flows performed (real browser run, localhost:5173 + backend :8080):**
Fresh seed data created via API (password password123):
- CLIENT: e2e-client-1788974843411@test.dev / FREELANCER: e2e-freelancer-1788974843411@test.dev
- OUTSIDER: e2e-outsider-1788974843411@test.dev
- Project A: 1c31e598-0678-4bef-a25a-360f48bf83f6 (job 4d305146-...)
- Project B: 5153efcc-8815-4141-ae1a-91d3ef0793b4 (job ac190d2e-...)

FLOW A — DIRECT COMPLETION: PASS
 1-2. Freelancer login; /projects lists both projects with status/price/duration/participants.
 3-6. Detail shows IN_PROGRESS, agreed price 3,500, 20 days; freelancer sees only "Submit Work".
 7-8. Submit Work -> confirmation modal -> SUBMITTED badge immediately (no reload);
      freelancer hint "waiting for the client"; Submit button gone.
 9-12. Logout, client login, same project: badge SUBMITTED (persisted); client sees
      "Request Revision" + "Complete Project" only.
13-15. Complete Project -> confirmation modal ("This is final: the job will be closed...")
      -> COMPLETED badge, completed panel with completedAt, no lifecycle buttons.
16-17. Backend check with browser session token: job status CLOSED, project COMPLETED.
18. Browser refresh: still COMPLETED and read-only (persistence PASS).

FLOW B — REVISION CYCLE: PASS
 1-2. Freelancer submits project B -> SUBMITTED.
 3-4. Client requests revision -> REVISION badge; client's Complete/Submit buttons gone.
 5. Freelancer sees "Submit Revision" (REVISION state) — client sees no submit action.
 6-7. Freelancer resubmits -> SUBMITTED again.
 8-9. Client completes -> COMPLETED; backend check: job ac190d2e-... CLOSED.
10. Refresh: still COMPLETED and read-only.

FLOW C — AUTHORIZATION: PASS
- Outsider login opens /projects/{id} of someone else's project: clean "Access restricted"
  error state, "You are not a participant of this project.", no project data rendered, no crash.
- (API level: outsider GET/POST both 403; see negative checks above.)

FLOW D — TERMINAL STATE: PASS
- COMPLETED projects (A and B): no Submit/Resubmit/Request Revision/Complete buttons;
  read-only panel with completedAt; state survives refresh.

**Negative checks in browser:**
- Buttons only exist for the correct role/state (freelancer never sees Complete;
  client never sees Submit; nobody sees actions on COMPLETED).
- Processing state disables confirm buttons (guard `if (processing) return;` plus
  disabled attributes), preventing duplicate transitions on double-click.
- Failed transitions never fake success: toast shows backend message and state is refetched.

**Regression checks (Steps 3–4): PASS**
- Login/logout both roles, marketplace loads, proposal detail still ACCEPTED with offer
  history intact, Step 4 project appears in /projects with correct links to its job and
  proposal (View Job / View Proposal), job still IN_PROGRESS.

**Code quality:**
- pnpm lint: PASS — 0 errors, 8 warnings. Of these, 6 pre-existed (2x unused catch in
  JobDetail.jsx, 3x only-export-components in ProposalStatusBadge.jsx, 1x set-state-in-effect
  in ProposalList.jsx). 2 NEW warnings, both in ProjectList.jsx:
  - set-state-in-effect: same pattern as the pre-existing ProposalList.jsx (loading/error
    state setters inside the data-load effect). Consistent with existing code, no functional issue.
  - only-export-components: ProjectStatusBadge re-exports a label helper — mirrors the
    pre-existing ProposalStatusBadge.jsx pattern.
- pnpm build: PASS (vite build).
- Backend: unchanged — no backend tests/build re-run.

**Data cleanup:** Step 5 E2E data (3 accounts, 2 jobs closed, 2 projects completed,
2 proposals accepted) left in DB — no delete endpoints exist for projects/proposals and job
deletion is correctly blocked by backend rules for non-OPEN jobs. No destructive cleanup
performed; protected persistence smoke-test records untouched.

## Next Session Priority
Steps 1–11 FINAL PASS. Next: STEP 12 (Final UI/UX redesign) when explicitly instructed —
it is the only remaining stage, alongside Postman/README finalization and demo prep.

Quick regression points after any change:
- ReviewSection on COMPLETED project detail (form -> reviewed state, no duplicates)
- Chat: open from ProposalDetail, real-time both directions, no duplicates on remount
- /projects list + detail states (loading/error/empty, role-based actions)
- Proposal detail action visibility (creator: none; recipient: Counter/Accept/Reject)
- Job detail role-based UI and marketplace loads for both roles

## Known Issues / Quirks
- The `api.js` client leverages the Vite proxy `/api` which maps to `localhost:8080` for backend communication to bypass CORS.
- oxlint reports 6 pre-existing warnings in JobDetail.jsx (unused catch params) — cosmetic, not addressed in Step 4.

**Important Rules For Next Session:**
- Do not restart backend stages.
- Do not treat stale stage numbering as authoritative.
- Future sessions must read architecture.md, PROJECT_STATE.md, and session-handoff.md before coding.
- Future sessions must inspect repository before making changes.
- Do not recreate frontend.
- Do not recreate backend.
- Do not redo initial setup.
- Do not redesign entities without explicit instruction.
- Do not ignore locked business rules.
- Do not implement features from memory.
- Do not assume documentation completion means feature implementation.
- Do not overwrite correct existing work.
- Do not bypass Spring Security layer in following implementations.
- Do not mark Step 4 as needing re-verification; it is FINAL PASS as of this session.
- Browser E2E verification is REQUIRED before declaring any future step FINAL PASS.

If documentation and repository state disagree:
STOP and report the discrepancy before implementation.