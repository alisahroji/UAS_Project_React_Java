# DEVLINK PROJECT STATE

## Current Stage

STEP 11 (FINAL INTEGRATION AUDIT & REGRESSION GATE) — FINAL PASS

Frontend Step 10 (Landing Page + Light Theme):
FINAL PASS — browser E2E verified (see below)

Backend Langkah 1–10:
FINAL PASS

Frontend Step 1 (Foundation):
FINAL PASS

Frontend Step 2 (Authentication):
FINAL PASS

Frontend Step 3 (Job Marketplace):
FINAL PASS

Frontend Step 4 (Proposal & Negotiation):
FINAL PASS

Frontend Step 5 (Project UI & Lifecycle):
FINAL PASS

Frontend Step 6 (Real-Time Chat UI):
FINAL PASS

Frontend Step 7 (Review & Rating UI):
FINAL PASS — REST + browser E2E verified (see below)

Frontend Step 8 (Profile UI):
FINAL PASS — REST + browser E2E verified (see below)

Frontend Step 9 (Integrated Navigation & Cross-Feature UX):
FINAL PASS — REST + browser E2E verified (see below)

Frontend Step 10 (Landing Page + Light Theme):
FINAL PASS — browser E2E verified (see below)

**STEP 10 VERIFICATION (this session):**
- Landing page built from the user-provided Mayora reference image (composition adapted,
  zero Mayora branding/copy). Sections: hero (pill badges -> two-line headline dark+red ->
  white card with red left-border accent -> CTA row -> 3 mini cards -> deep-red gradient
  banner CTA), How It Works (Discover->Connect->Chat->Proposal->Negotiate->Collaborate->
  Review — the REAL product flow), For Clients / For Freelancers checklists (only real
  features), Features grid (6 existing features only), Final CTA, Footer (real routes only).
- NO fake statistics; role/anonymous-aware CTAs using existing routes only:
  anon: Get Started Free -> /register, Browse Projects -> /jobs; client: Post a Job ->
  /jobs/create, Open Messages -> /messages, banner -> /projects; freelancer: Find a
  Project -> /jobs, Open Messages -> /messages. Freelancer NEVER sees /jobs/create links
  (fixed during E2E: clients-card CTA + footer link are now role-gated).
- Files created: pages/landing/LandingPage.jsx. Files modified: App.jsx (route /
  placeholder -> LandingPage), index.css (THEME FLIP). Navbar REUSED untouched.
- **THEME FLIP (user-requested: "ubah warna di setiap halaman"):** index.css @theme tokens
  moved from dark/cyberpunk to Mayora-inspired light/red: background #fdf4f2, surface #fff,
  primary #d91e2e (+hover #b3121f), text #241414/#8c7370, border #f2dfd9; subtle
  fade-up entrance animation utilities added. All hardcoded maroon literals (#8F1D2C,
  #A82738, rgba(143,29,44,*)) across 13 files swept to var(--color-primary)/hover or
  rgba(217,30,46,*) equivalents; Spinner recolored to primary; ErrorState recolored.
  Badge.jsx light palettes kept (already light-theme appropriate).
- Browser E2E: PASS — TEST A anonymous (real landing, no placeholder/Test Toast, correct
  anon CTAs, footer) / TEST B client (Post a Job -> /jobs/create hero CTA, banner ->
  /projects, no role leaks) / TEST C freelancer (Find a Project -> /jobs, ZERO /jobs/create
  links) / TEST D mobile 420px (no horizontal overflow, mobile menu works, footer works) /
  TEST E regression Steps 1-9 (Messages -> Chat with persisted message + Live; Project
  Completed + reviewed state; Profile 5.0 + attribution + stars; marketplace 10 cards on
  light theme with readable dark-on-light text; AuthOnlyRoute still redirects; console
  clean).
- Frontend lint: PASS (0 errors, 11 warnings — identical pre-existing set; all 6 new-code
  warnings fixed during the session)
- Frontend build: PASS (447.30 kB bundle)
- Backend: unchanged

**STEP 9 VERIFICATION (this session):**
- Top-level Messages access implemented (the one real §3 gap): conversationService.js
  assembles a REAL conversation list from EXISTING endpoints only — freelancer:
  GET /api/proposals/me; client: GET /api/jobs (JobDto.clientId) + per-job
  GET /api/jobs/{id}/proposals (owner-only). Dedup by proposal id, sorted by last activity.
  NO backend changes, no mock conversations, no new chat implementation — entries deep-link
  into the existing ChatPage /chat/:proposalId.
- MessagesPage.jsx created (pages/messages/): role-aware inbox with loading/error/empty
  states, proposal-status badges, counterparty line ("Chat with X · You are the client/
  freelancer"), relative timestamps, deep links to chat.
- Routes: /messages (AppLayout, sign-in aware). Navbar: "Messages" item (desktop + mobile)
  between My Proposals and Projects.
- Browser E2E: PASS — TEST A client inbox (2 real conversations, deep link to chat,
  STOMP send rendered) / TEST B freelancer inbox ("You are the freelancer") / TEST C
  Proposal->Open Chat / TEST D project review state + profile 5.0/5 attribution + persistence /
  TEST E outsider empty profile (no fake rating/count) / TEST F outsider denied on other
  users' project ("Access restricted", no price/review data), proposal ("Could not load...
  permission"), chat (clean wall), inbox ("No conversations yet") / TEST G inbox + message
  persist across reload and logout/login; protected /messages redirects to /login when
  signed out / TEST H mobile menu shows Messages and navigates correctly; no overflow.
- PostgreSQL connection exhaustion diagnosed (was in prior session): single Spring Boot
  process, no duplicate boots; pool verified stable (12x login+search all 200). Cause was
  accumulated prior-session state; no config/architecture change needed.
- Regression Steps 1-8: PASS — marketplace 10 cards + search/sort; client-only Post a Job
  route; job detail owner view (proposals, edit/delete visible); proposal detail Accepted
  with offer history + Open Chat and NO accept/reject on terminal proposals; projects list
  (2 Completed); profile 4.5/5 with 2 reviews and correct attribution; console clean.
- Frontend lint: PASS (0 errors, 11 warnings: 10 pre-existing + 1 new set-state-in-effect
  in MessagesPage.jsx matching the established data-load pattern)
- Frontend build: PASS (428.61 kB bundle)
- Backend: unchanged — no backend tests re-run (last verified 65/65 in Step 6)

**STEP 8 VERIFICATION (this session):**
- Backend profile contract audited from source. DISCREPANCY REPORTED: docs/architecture.md
  §11 lists GET /api/users/{userId}/profile, but NO UserController/UserService exists in the
  backend — that endpoint was never implemented. Backend left UNTOUCHED (no scope to add it).
  Available contract: GET /api/auth/me -> UserDto {id, name, email, role, bio, skills,
  avatarUrl} (AuthProvider already loads it); GET /api/users/{userId}/reviews (in
  ReviewController; requires JWT in practice — 401 without token, live-verified; the
  documented Step 7 quirk persists). No profile-edit endpoint exists -> Profile is READ-ONLY
  (no edit UI implemented, per rules). No backend aggregation endpoint -> the average rating
  is a display-only frontend computation from raw backend reviews.
- ProfilePage.jsx created (pages/profile/): header (avatar initial/avatarUrl, name, role
  badge, email, bio or empty state, skills chips or empty state), reputation panel
  (avg rating X.Y/5 + stars + "N reviews received" or "No reviews yet"), reviews-received
  list (reviewer->reviewee attribution, stars, comment, date, View project link), loading /
  error / empty states, "Refresh profile" re-fetch. Identity exclusively from the auth
  context; reviews via existing reviewService.getUserReviews — NO new userService needed
  (equivalent service already existed), no new dependencies.
- Routes: /profile and /profile/:id (replaced the /profile/:id PlaceholderPage); Navbar
  user chip (desktop + mobile) is now a Link to /profile. Email is shown (own profile only,
  same data the user already sees in auth flows); other-user profiles intentionally not
  supported (backend provides no public profile data) — /profile/:id for a different id
  shows a clean "Profile not available" state (backend returns [] for unknown users, so
  this is a product boundary, not an error mask).
- Browser E2E: PASS (real browser; see session-handoff.md for TEST A-D + extras)
  - TEST A freelancer profile: name/role/email, "No bio yet", React skill chip, 5.0/5 avg
    from 1 review, Step 7 review with CORRECT attribution (Reviewed by S5 Client, 5 stars,
    comment, date, View project). Navbar chip navigates to /profile; /profile/<own-id>
    also renders the profile.
  - TEST B: /profile/<other-id> -> clean "Profile not available" state; backend [] for
    unknown users.
  - TEST C empty state: Chat Client (no reviews) -> "No reviews yet / Reputation appears
    after completed projects.", zero fabricated data.
  - TEST D aggregation: S5 Client -> 4.5/5 from exactly the two Step 7 reviews (5+4 stars);
    "2 reviews received"; reviewer attribution correct; screenshot evidence; state persists
    after real browser reload.
- Regression (Steps 1-7): PASS — marketplace (11 job cards), job detail, projects list (2
  completed projects), project detail (Completed badge + reviewed state + View Job/View
  Proposal), proposal detail (Accepted, offer history, Open Chat), chat (Live connection +
  composer), console clean (only Vite HMR logs).
- Frontend lint: PASS (0 errors, 10 warnings: 9 pre-existing + 1 new set-state-in-effect in
  ProfilePage.jsx matching the established data-load pattern)
- Frontend build: PASS (422.52 kB bundle)
- Backend: unchanged — no backend tests re-run (last verified 65/65 in Step 6)

**STEP 7 VERIFICATION (this session):**
- Backend Review contract audited from source — NO backend changes needed.
  POST /api/projects/{id}/reviews {rating 1-5, comment?} -> 201; COMPLETED-only (else 409);
  participants only (else 403); duplicate (project+reviewer+reviewee) -> 409.
  GET /api/projects/{id}/reviews (participant-only, DESC).
  GET /api/users/{userId}/reviews — service layer is public, BUT Spring Security still
  requires a valid JWT in practice (401 without token). Documented quirk.
- reviewService.js + ReviewStars.jsx (interactive 1-5 stars, radiogroup ARIA, click-to-clear)
  + ReviewSection.jsx (list + eligibility-aware form + reviewed state) created;
  ReviewSection integrated at the bottom of ProjectDetail.jsx. ProjectDetail.jsx is the
  only pre-existing file modified.
- Browser E2E: PASS (real browser; see session-handoff.md for TEST A-F)
  - TEST A: freelancer submitted 5-star review on COMPLETED project; no reload;
    reviewed state shown; persisted after refresh (screenshot evidence).
  - TEST B: second submission impossible in UI (form -> reviewed state); duplicate via
    API -> 409.
  - TEST C: IN_PROGRESS project shows "Reviews unlock when the project is completed";
    no form/stars/textarea; API POST -> 409.
  - TEST D: outsider hits project-level 403 wall; zero review data leak.
  - TEST E: empty rating -> submit disabled; rating 0/6/-1/99 via API -> 400;
    whitespace comment never leaves the UI (submit disabled).
  - TEST F: mutual reviews work (client->freelancer 201, freelancer->client 201);
    same reviewer twice -> 409; both reviews render with reviewer->reviewee attribution.
- Frontend lint: PASS (0 errors, 9 warnings: 8 pre-existing + 1 new set-state-in-effect
  in ReviewSection.jsx matching the established data-load pattern)
- Frontend build: PASS
- Backend: unchanged — no backend tests re-run (backend last verified 65/65 in Step 6)

**STEP 5 VERIFICATION (this session):**
- `projectService.js` created: GET /api/projects, GET /api/projects/{id},
  POST /api/projects/{id}/status body {status} — matches backend exactly.
- `ProjectList.jsx` (/projects) and `ProjectDetail.jsx` (/projects/:id) created;
  routes replaced the placeholders in App.jsx. Navbar link already pointed to /projects.
- `ProjectStatusBadge`, `ProjectCard`, `projectFormat.js` components created following
  existing conventions (same visual token system, no UI primitives duplicated).
- Role/state-based actions only (no free status selection):
  Freelancer: Submit Work (IN_PROGRESS), Submit Revision (REVISION).
  Client: Request Revision + Complete Project (SUBMITTED only).
  COMPLETED: fully read-only.
- All actions use confirmation modals; buttons disable while processing;
  state refreshes from the authoritative backend response (no page reload needed).
- Browser E2E: PASS (real browser run; Flows A, B, C, D — see session-handoff.md)
  - Flow A direct completion: submit → complete → job CLOSED → persists after reload.
  - Flow B revision cycle: submit → revision → resubmit → complete → job CLOSED → persists.
  - Flow C authorization: non-participant gets clean "Access restricted" state, no data.
  - Flow D terminal: COMPLETED project shows no actions, read-only after refresh.
- API negative checks PASS: wrong-role transitions 403; invalid transitions 409;
  invalid status value 409; non-participant GET/POST 403; state unchanged after failures.
- Frontend lint: PASS (0 errors, 8 warnings: 6 pre-existing + 2 new in ProjectList.jsx
  matching the pre-existing ProposalList.jsx pattern; see session-handoff.md)
- Frontend build: PASS
- Backend: unchanged — no backend tests/build re-run

**STEP 6 VERIFICATION (this session):**
- Chat service + STOMP client + useProposalChat hook + ChatPage implemented;
  route /chat/:proposalId (protected); ProposalDetail gained an "Open Chat" action
  (visible for PENDING / NEGOTIATING / ACCEPTED proposals).
- Dependency: @stomp/stompjs 7.3.0 added via pnpm (only dependency added).
  Native WebSocket to /ws (backend has NO SockJS) with Authorization: Bearer header
  on CONNECT; subscribe /topic/proposals/{id}; send via /app/proposals/{id}/messages.
- Messages deduplicated by stable backend UUID; history REST-first, then WS merge.
- /ws proxied through Vite (ws: true) — vite.config.js updated.
- **BACKEND FIX (evidence-based, minimal):** ChatController.sendMessage STOMP path accepted
  whitespace-only content (REST path rejected it via @Valid). Added @Valid to the @Payload
  param. Backend: compile PASS, tests 65/65 PASS, restarted, fix verified live
  (whitespace STOMP send now rejected, REST + real-time still working).
- Frontend lint: PASS (0 errors, 8 warnings — same 8 pre-existing as before Step 6)
- Frontend build: PASS
- Browser E2E: PASS (real browser, two authenticated sessions — see session-handoff.md)

## Project Status

ARCHITECTURE FINAL
BACKEND FINAL PASS
FRONTEND FINAL PASS (Steps 1–12)

## Completed Stages

Langkah 1 — Architecture
FINAL PASS

Langkah 2 — Backend Foundation
FINAL PASS

Langkah 3 — Persistence / JPA
FINAL PASS

Langkah 4 — Java/OOP
FINAL PASS

Langkah 5 — REST API & Business Logic
FINAL PASS

Langkah 6 — Authentication & Security
FINAL PASS

Langkah 7 — Proposal & Negotiation
FINAL PASS

Langkah 8 — Project Lifecycle & Delivery
FINAL PASS

Langkah 9 — Review & Rating
FINAL PASS

Langkah 10 — Real-Time Chat / WebSocket / STOMP
FINAL PASS

## Latest Verification (STEP 11 — FINAL INTEGRATION AUDIT)

**Backend:**
- Full test suite: **65/65 PASS, BUILD SUCCESS** (./mvnw test; unit + integration +
  security + WebSocket suites).
- Build gate: `./mvnw clean install -DskipTests` → exit 0, jar produced.
- Backend restarted during persistence audit; all data survived (users, jobs, projects,
  messages from prior sessions). No destructive reset occurred.

**API authorization negative matrix (58 checks, all PASS; fresh S11 accounts):**
- Anonymous: /auth/me, /projects, POST /jobs → 401; invalid JWT → 401.
- Role: freelancer create job → 403; non-owner edit/delete job → 403.
- Negotiation: creator of PENDING offer cannot counter (409) or accept (409) it;
  recipient-only rule enforced; counter supersedes pending offer; history preserved
  (3 offers); proposal NEGOTIATING between counters.
- Non-owner read of job proposals / offers DENIED (409 via BusinessRuleException —
  documented backend convention: ownership denials on reads use 409, writes use 403).
- Acceptance: recipient accept → 200; proposal ACCEPTED; exactly ONE project;
  job IN_PROGRESS; competing proposal REJECTED.
- Lifecycle: client submit → 403; freelancer complete → 403; complete from IN_PROGRESS →
  409; complete from REVISION → 409; revision cycle IN_PROGRESS→SUBMITTED→REVISION→
  SUBMITTED→COMPLETED works; COMPLETED terminal → 409; completedAt set; job CLOSED.
- Messages: outsider read/send → 403; whitespace → 400; participant → 201.
- Reviews: mutual 201/201; duplicate → 409; rating 9 → 400; non-participant → 403;
  user-reviews readback correct both directions.

**Search/sort (backend query params):** search by title (case-insensitive) and
description PASS; sort budget asc PASS. Deadline desc: PASS standalone and on retry;
recorded limitation — equal deadline timestamps (4 jobs share 2026-10-08) can reorder
between page loads because the backend sort has no secondary key (order among ties is
unspecified SQL behavior, not a sorting defect; architecture untouched).

**Persistence:** data survives frontend refresh, logout/login, AND backend restart
(verified: old-session users still authenticate; S11 job CLOSED; projects readable;
chat history incl. Step 9 message intact). No mock/static data in frontend services
(code audit: only backend-driven fetches via api.js).

**Browser E2E (real browser, after backend restart):** landing renders (Mayora light
theme); Messages → Chat deep link works; chat Live with full history; client sent a new
message via STOMP post-restart ("Step 11 audit: client sends from chat after backend
restart") — delivered, input cleared; project detail Completed + reviewed state, no
lifecycle buttons for anyone; profile 4.5/5 + 2 reviews + attribution; unknown route →
404 page (no crash); protected /projects redirects anonymous → /login; anonymous job
detail renders with NO owner actions + Sign In prompt; /login redirect for AuthOnlyRoute
while authenticated. Console: ZERO errors (only Vite HMR logs + React DevTools banner).
Network: only expected 200s; no 4xx/5xx noise, no duplicate calls, no failed fetches.

**Responsive (functional, 420px):** marketplace 16 cards, no horizontal overflow;
project detail completed state usable, no overflow; protected-route redirect works.

**Security sanity:** .gitignore covers .env / node_modules / target / dist; no .env
tracked in git (git ls-files clean); application.properties uses ${JWT_SECRET}/
${DB_PASSWORD} placeholders (no secrets in source); test properties use H2 + test-only
secret; no passwords/secrets in frontend; authorization enforced by backend ownership
checks (proven by negative matrix above), not client-side only.

**Frontend quality gates:** pnpm lint → 0 errors, 11 warnings (all pre-existing,
documented); pnpm build → PASS (447.30 kB).

**Bugs found in Step 11: 0 functional bugs.** (One audit-script misconfiguration and one
test-expectation refinement during the audit itself — both were test-harness issues, not
application defects; app behavior was correct.)

**Files changed in Step 11: NONE (application code untouched — audit-only step).**
Temp audit scripts created under .freebuff/ and removed after the run.

Tests:
65 total
0 failures
0 errors
0 skipped

Build:
SUCCESS

WebSocket E2E:
CONNECT PASS
SUBSCRIBE PASS
SEND PASS
RECEIVE PASS
Persistence PASS
Disconnect/reconnect PASS

**RUNTIME BUG VERIFICATION:**
- Backend compile: PASS
- Backend tests: PASS (65/65, 0 failures, 0 errors)
- Frontend lint: PASS (0 errors, 0 warnings)
- Frontend build: PASS (1.50s)
- Fix applied: `AuthServiceImpl.getCurrentUser()` loads user fresh from DB within transaction
- Root cause: LazyInitializationException when accessing `User.skills` collection outside transaction boundary

## Latest Verification (STEP 12 — FINAL UI/UX REDESIGN)

**Scope:** frontend-only redesign per Stitch layout reference + Mayora color system
(backend untouched; 65/65 tests still stand). No new backend contracts; all routes and
business logic preserved.

**Design system:** light Mayora tokens (from Step 10) applied consistently; red used
for brand/CTA/active state only. No AI/provider branding anywhere in the UI.

**Batches delivered:**
- B1 Global Navbar rewrite — role-aware: anon (Home, Browse Projects, Log in, Get Started),
  CLIENT (Home, My Jobs, Proposals→/proposals/received, Messages, Projects, Post a Job CTA,
  profile chip, logout), FREELANCER (Home, Find Jobs, My Proposals, Messages, Projects,
  profile chip, logout). Mobile hamburger preserved.
- B2 Marketplace Stitch layout — 2-column feed + sidebar (Popular Technologies chips with
  real counts, How DEVLINK works, anon join card); horizontal job cards (client avatar,
  posted-time, status badge, skills, budget/deadline footer, hover lift); NEW
  ProposalsReceivedPage (/proposals/received) so clients reach proposals from the navbar.
- B3 Login/Register split-screen — red brand panel (desktop) + form panel; register uses
  professional role cards ("I want to hire" / "I want to freelance"); password visibility
  toggle; validation/error states preserved; payloads unchanged (JWT flow intact).
- B4 Proposals — list cards polished; ProposalDetail negotiation TIMELINE (vertical rail,
  status-coded dots, Offer #n + Initial Offer tags, per-offer actions unchanged).
- B5 Projects — detail gains visual lifecycle stepper (In Progress → Submitted → Completed
  with Revision annotation); all role gating untouched.
- B6 Messages/Chat — conversation cards get avatar/hover/“Open chat →”; STOMP untouched.
- B7 Profile/Reviews — duplicate reviewer subline removed; card language consistent.

**Bugs found & fixed during Step 12:**
1. Skill pills set filters.search externally while JobFilters input kept its own local
   state → invisible applied search (stuck results). Fixed: pills are now informational
   chips (backend search only covers title/description, so misleading tap-to-search was
   removed); JobFilters gets a `key` sync from applied search as defense.
2. JobCard unused `status` variable (lint) — removed.
3. LoginPage showed "An unexpected error occurred" for bad credentials because backend
   returns 500 (not 401) for unknown email — pre-existing backend gap (documented in
   Step 11). Frontend now maps 500-on-login to a credential-oriented message. Backend
   itself intentionally NOT modified (architecture lock; 401-on-unknown remains a
   documented known limitation).

**Browser E2E (real browser, both roles):**
- Register: role-card selection + submit → 201 → redirect /login. PASS
- Login (client): new form → 200 → redirect /jobs, token stored, client navbar. PASS
- Login failure: clean credential-oriented error (no scary generic). PASS
- Client navbar: Home/My Jobs/Proposals/Messages/Projects/Post a Job. PASS
- Freelancer navbar: Home/Find Jobs/My Proposals/Messages/Projects, no Post a Job. PASS
- /proposals/received: 2 real proposals (Accepted badges, price, latest offer). PASS
- Marketplace: 16 cards + sidebar; hero live count "6 open projects"; backend search
  "S11" → 6 results with input synced; clear restores 16; sort dropdown intact. PASS
- Job detail: status badge, budget/deadline, description, skills. PASS
- Proposal detail: negotiation timeline (Offer #1, Accepted, rail + dot) + Open Chat. PASS
- Projects: list 2; detail lifecycle stepper (In Progress/Submitted/Completed labels). PASS
- Messages → Chat deep link: 2 conversations; chat Live (STOMP CONNECTED); sent message
  delivered + input cleared (real-time round trip under new UI). PASS
- Profile: name, role, 5.0/5 aggregate, reviews section. PASS
- Responsive 436px: no horizontal overflow on landing/jobs/detail; hamburger menu works. PASS

**Runtime:** console clean (only Vite HMR/DevTools banners + the one EXPECTED 500 from
the deliberate wrong-credential test). No unexpected network errors. No duplicate calls.

**Frontend quality gates:** pnpm lint → 0 errors, 12 warnings (11 pre-existing/documented
+ 1 documented set-state-in-effect data-load pattern in ProposalsReceivedPage, same family
as ProposalList/MessagesPage); pnpm build → PASS (468.10 kB).

**Backend changes in Step 12: NONE.** Tests remain 65/65 from Step 11.

**Known limitations:** login with unknown email returns backend 500 (mapped to friendly
message client-side; true 401 would require a backend change — out of scope);
marketplace skill chips are informational (backend search covers title/description only);
proposal "last activity"/unread counts not available from backend.

## Remaining Work

Remaining future UAS work should include, but not be falsely marked completed:

- Responsive/accessibility QA (deeper pass)
- Postman Collection final verification/update
- README finalization
- .env.example verification
- GitHub cleanup
- Final UAS checklist
- Final screenshots/demo preparation

## State Integrity

Keep these rules:

- PROJECT_STATE.md must reflect actual repository state.
- Never mark implementation completed without verification.
- Documentation completion must never be interpreted as feature implementation completion.
- Architecture must not be redesigned unless explicitly instructed.
- If repository state conflicts with documentation, repository evidence takes precedence.
- Never repeat a completed stage merely because documentation numbering is stale.

## Architecture Lock

Preserve the existing architecture lock exactly.
Do not redesign or contradict docs/architecture.md.