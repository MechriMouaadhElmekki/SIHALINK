---

name: sihalink-development

description: Project-specific development workflow and security rules for SIHALINK. Use when analyzing, implementing, debugging, testing, reviewing, or validating changes in the SIHALINK repository.

---



# SIHALINK Development Skill



## Mission



Develop SIHALINK safely and systematically.



The required workflow is:



AUDIT → PLAN → IMPLEMENT → TEST → DEBUG/FIX → RETEST → VERIFY → REPORT



Do not skip stages when they are relevant to the task.



---



# 1. AUDIT FIRST



Before modifying code, inspect the relevant repository structure, implementation, configuration, tests, migrations, APIs, and dependencies.



Determine:



- what currently exists

- how the relevant feature currently works

- all relevant callers and mutation paths

- related tests

- related database schema/migrations/RPCs/triggers/RLS

- configuration and environment assumptions

- potential security implications

- compatibility risks



Never begin implementation based only on the user's description when repository inspection is possible.



For repository-wide changes, search the entire repository for relevant references before editing.



---



# 2. REPOSITORY ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â  LIVE DATABASE



Never assume the repository database definitions are identical to the live Supabase database.



Explicitly distinguish:



- LIVE VERIFIED

- REPOSITORY VERIFIED

- DESIGN-ONLY

- NOT VERIFIED



Never report a live database fact unless it was actually queried or independently verified.



Examples of facts that require live verification when relevant:



- tables and columns

- indexes

- constraints

- RLS enabled/disabled state

- policies

- functions/RPCs

- function ownership

- SECURITY DEFINER

- function search_path

- grants

- triggers

- trigger functions

- migration application state



Never claim a migration was applied merely because its SQL exists in the repository.



---



# 3. PLAN BEFORE IMPLEMENTATION



Create a concise implementation plan before making substantial changes.



The plan should identify:



- affected files

- affected database objects

- dependencies

- expected behavior

- security invariants

- tests/verification required

- rollback or recovery considerations



When uncertainty is significant, challenge the plan before implementation.



Prefer minimal, reversible changes over broad rewrites.



---



# 4. SIHALINK SECURITY RULES



Treat these as security-critical:



- authentication

- authorization

- roles

- role expiry

- RLS

- SECURITY DEFINER functions

- RPCs

- migrations

- triggers

- emergency workflows

- audit logging

- notifications

- media access

- PII

- operator access

- profile security fields



Never trust security-sensitive identity fields supplied by the client when the server/database can derive them from the authenticated identity.



Never allow clients to arbitrarily choose:



- actor identity

- actor role

- authorization result

- ownership/security fields

- privileged status transitions

- privileged assignees

- audit actor identity

- protected timestamps

- protected workflow fields



Authorization must be verified at the correct security boundary.



---



# 5. EMERGENCY WORKFLOW



Preserve the canonical SIHALINK emergency state machine unless an explicit requirement authorizes changing it.



Canonical states:



DRAFT

SUBMITTED

RECEIVED

UNDER_REVIEW

ASSIGNED

ACKNOWLEDGED

IN_PROGRESS

RESOLVED

REJECTED

CANCELLED

FALSE_REPORT_REVIEW

CLOSED



Canonical transitions:



DRAFT ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ SUBMITTED, CANCELLED



SUBMITTED ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ RECEIVED, CANCELLED, REJECTED



RECEIVED ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ UNDER_REVIEW, REJECTED



UNDER_REVIEW ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ ASSIGNED, REJECTED, FALSE_REPORT_REVIEW



ASSIGNED ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ ACKNOWLEDGED, REJECTED



ACKNOWLEDGED ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ IN_PROGRESS, REJECTED



IN_PROGRESS ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ RESOLVED, REJECTED



RESOLVED ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ CLOSED



FALSE_REPORT_REVIEW ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ CLOSED, REJECTED



Terminal states:



CANCELLED

REJECTED

CLOSED



Do not invent obsolete states or transitions such as REASSIGNED unless the project explicitly changes the canonical model.



---



# 6. DATABASE CHANGE RULES



Before changing RLS, permissions, grants, triggers, RPCs, migrations, or database mutation behavior:



1. Inspect all application mutation paths.

2. Inspect relevant repository migrations.

3. Inspect relevant live schema when access exists.

4. Identify compatibility requirements.

5. Identify existing clients/routes/RPCs that depend on the behavior.

6. Verify whether the proposed security change would break legitimate operations.



Do not revoke permissions first and discover afterward that an application path depended on them.



Do not write a migration that assumes another migration was applied unless that dependency is explicitly verified and documented.



Migration ordering must be explicit.



Do not blindly use CASCADE to solve dependency problems involving security-critical database objects.



---



# 7. RPC AND SECURITY DEFINER RULES



For SECURITY DEFINER functions:



- verify ownership

- use a secure explicit search_path

- avoid unsafe object resolution

- restrict EXECUTE privileges appropriately

- derive actor identity from auth.uid() where applicable

- verify caller authorization

- validate all important arguments

- enforce ownership or privilege boundaries inside the function

- use atomic/optimistic concurrency checks where needed

- avoid exposing arbitrary privileged database mutation



Do not assume service_role privileges behave like ordinary authenticated-user privileges.



Do not claim a privilege boundary is secure without checking the actual relevant database behavior.



---



# 8. ACTOR IDENTITY AND AUDIT



Server-side actor identity must come from the authenticated session/database security context whenever possible.



Do not trust client-supplied:



- actor_id

- actor_role

- author_id

- opened_by

- uploaded_by

- changed_by



Audit entries must reflect real operations.



Do not create duplicate history or duplicate status-change events.



For state transitions, there should be one canonical status-history writer and one intended status-change event per transition unless the architecture explicitly requires otherwise.



---



# 9. ROLE EXPIRY



When role expiry exists, authorization must respect effective/nonexpired roles.



Do not replace role expiry with a weaker approximation such as profile account status.



When checking eligibility for a privileged operator/administrator/assignee, verify:



- authenticated identity

- active role

- nonexpired role

- required privilege



Never assume a role remains active simply because a role row exists.



---



# 10. EMERGENCY TRANSITION INVARIANTS



For privileged emergency transitions:



- the caller must be authorized

- the requested status must be a canonical status

- the transition must be valid

- stale concurrent updates must be rejected safely

- protected report fields must not be arbitrarily modified

- assignment must validate the assignee's authorization

- RESOLVED timestamps should be generated by the trusted server/database path

- cancellation requirements must be enforced consistently

- terminal states must not be casually mutated

- unrelated fields must remain immutable during status changes



For ASSIGNED:



- assignee must exist

- assignee must have an appropriate active, nonexpired privileged role



For CANCELLED:



- cancellation reason requirements must match the project's canonical cancellation policy



Do not invent cancellation states or semantics.



---



# 11. CLIENT / SERVER VALIDATION



Validate input at the correct boundary.



Client validation is for UX.



Server/database validation is the security boundary.



Never rely on client-side validation to enforce authorization or privileged state.



Be particularly careful with:



- status

- priority

- assignment

- timestamps

- ownership IDs

- profile security fields

- audit fields

- workflow flags



---



# 12. API MUTATION AUDIT



Before changing a database permission or RLS policy, search the full repository for:



- `.update(`

- `.insert(`

- `.delete(`

- `.upsert(`

- SQL UPDATE statements

- SQL INSERT statements

- RPC calls

- route handlers

- server actions

- services

- stores

- hooks

- background jobs



For critical tables, inspect every meaningful mutation path before closing direct client access.



---



# 13. TESTING



After implementation:



- run relevant unit tests

- run relevant integration tests

- run type checking

- run linting where applicable

- run production/build validation where applicable

- run E2E/browser tests when UI behavior is affected

- perform adversarial testing for security-sensitive changes



If something fails:



1. determine the root cause

2. fix it

3. rerun the relevant validation



Do not stop after the first compile succeeds.



Do not claim a test passed unless it actually ran.



Do not claim a build passed unless it actually ran.



Do not claim a migration succeeded unless it actually ran successfully.



---



# 14. TEST COVERAGE FOR SECURITY-CRITICAL CHANGES



For emergency authorization/state changes, consider at minimum:



1. authenticated authorized caller

2. authenticated ordinary user

3. unauthenticated caller

4. expired privileged role

5. valid active privileged caller

6. invalid status

7. invalid transition

8. stale concurrent update

9. valid transition

10. invalid/nonexistent assignee

11. ordinary user as assignee

12. expired-role assignee

13. valid active privileged assignee

14. protected field injection

15. unauthorized direct database UPDATE

16. ownership violation

17. duplicate history/event detection

18. terminal-state mutation attempt



Clearly distinguish:



- EXECUTED

- NOT EXECUTED

- DESIGN-ONLY



---



# 15. BROWSER / UX VERIFICATION



When UI behavior changes, use Playwright and/or the project's browser-testing capabilities where appropriate.



Verify:



- normal user flows

- validation failures

- loading states

- error states

- authorization boundaries

- mobile/responsive behavior when relevant

- repeated submission

- refresh/back navigation

- network failure handling

- stale data behavior

- emergency workflow edge cases



Use adversarial UX testing for important workflows.



---



# 16. MULTI-AGENT DEVELOPMENT



When multiple coding agents are used:



- define clear ownership of the task

- avoid overlapping edits

- inspect current repository state before editing

- preserve existing work unless explicitly authorized to replace it

- review agent output before accepting it

- resolve merge conflicts carefully

- never assume another agent's implementation is correct merely because it compiles



Use the available agent/delegation and merge tools when they improve reliability.



---



# 17. GIT RULES



Before substantial work:



- inspect git status

- inspect current branch

- inspect recent commit

- understand uncommitted changes



Never destroy existing local work without explicit authorization.



Do not use:



- git reset --hard

- git clean

- broad file deletion

- force pushes



unless explicitly authorized and the consequences are understood.



Keep commits focused and descriptive.



Never commit:



- secrets

- credentials

- tokens

- .env files containing secrets

- local authentication state

- generated private machine state



---



# 18. SEMGREP / SECURITY TOOLING



Local security-tool state should remain local unless the repository explicitly requires it.



Do not commit authentication or machine-specific Semgrep state.



Respect security scanner findings.



Never bypass a dangerous security verdict merely to make installation succeed.



---



# 19. DEPLOYMENT RULE



Deployment is a separate action.



Do not:



- deploy production

- modify production secrets

- apply production migrations

- push unrelated changes

- destroy environments



unless explicitly authorized.



Development validation and production deployment are different stages.



---



# 20. STOP CONDITIONS



A task is complete only when:



- implementation is complete

- relevant tests are run

- relevant failures are fixed

- retesting is complete

- important assumptions are verified

- no known blocking issue remains within scope



Do not continue endlessly after acceptance criteria are satisfied.



If a blocker prevents completion, stop and report the blocker precisely.



---



# 21. REPORTING FORMAT



At the end of significant work, report:



## Status



COMPLETE / PARTIAL / BLOCKED / REJECTED



## Changes



List exactly what changed.



## Verification



For each validation item, mark:



- VERIFIED ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â EXECUTED

- VERIFIED ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â REPOSITORY

- NOT VERIFIED

- DESIGN-ONLY



## Tests



List exact commands/tests that actually ran and their results.



## Database



Clearly separate:



- repository findings

- live database findings

- assumptions



## Security



List relevant security invariants and whether they were verified.



## Remaining Risks



List unresolved risks only.



## Blockers



List blockers with exact reasons.



## Git



Report:



- branch

- commit

- working-tree status

- whether changes were pushed



Never claim an action occurred unless it actually occurred.



---



# 22. DEFAULT BEHAVIOR



When a request is ambiguous:



- inspect first

- avoid guessing

- preserve existing architecture where reasonable

- favor secure minimal changes

- ask for clarification only when necessary to proceed safely



When the task is clearly scoped:



AUDIT → PLAN → IMPLEMENT → TEST → DEBUG/FIX → RETEST → VERIFY → REPORT



Always prioritize correctness, security, evidence, and completion over speed.


