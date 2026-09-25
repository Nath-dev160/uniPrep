# UniPrep — Development Handoff

## 1. Purpose

This document is a handoff for continuing development of **UniPrep** in a new AI-assisted development environment such as Google AI Studio Build Mode.

**Do not rebuild UniPrep from scratch.** Inspect the existing repository first, preserve completed work, and continue from the current state described below.

Primary sources of truth:
1. `PROJECT_SPEC.md` — full product and technical specification.
2. `UNIPREP_HANDOFF.md` — current development-state handoff.

If this document and the repository differ, inspect the repository and `PROJECT_SPEC.md` before changing code.

---

## 2. Product

**Name:** UniPrep  
**Tagline:** Prepare with purpose.

UniPrep is a university-focused web application for students to:
- practice course questions;
- simulate real examinations;
- understand strengths and weaknesses;
- track accuracy and answering speed;
- receive explanations;
- report potentially incorrect questions/answers.

Academic hierarchy:

```text
University
   ↓
Faculty
   ↓
Department
   ↓
Academic Level
   ↓
Course
   ↓
Topic
   ↓
Question
```

Two assessment modes are planned:

### Practice
- Immediate results.
- AI-assisted explanations.
- Course/topic performance review.

### Real examination
- Configurable timer.
- Question navigation and review.
- Optional calculator.
- Integrity signals such as fullscreen exit, tab switching, copy/paste attempts, focus changes, and connection events.
- Correct answers must **not** be unnecessarily sent to the browser during an active examination.

Browser integrity mechanisms are signals/deterrents, not guarantees against cheating.

---

## 3. Current development state

Completed:

```text
Phase 0      Project specification              COMPLETE
Phase 1A     Project foundation                 COMPLETE
Phase 1A.1   UI/UX refinement + navigation      COMPLETE
Phase 1B     Supabase integration foundation    COMPLETE
```

Next:

```text
Phase 2 — Database + Authentication
```

Phase 2 has **not** been implemented yet.

Do not assume database tables, authentication, profiles, RLS, question data, or exam functionality already exist.

---

## 4. Phase 0 — Specification

`PROJECT_SPEC.md` contains the full product specification, including:
- product vision;
- student/admin features;
- practice and real-test modes;
- question types;
- question bank;
- reporting;
- AI explanations;
- performance analytics;
- calculator;
- integrity signals;
- academic hierarchy;
- authentication;
- technology stack;
- database entities/relationships;
- RLS;
- answer-key security;
- route map;
- visual design;
- development phases.

**Read it before making substantial changes.**

---

## 5. Phase 1A — Foundation

Established:
- Next.js App Router;
- TypeScript strict mode;
- Tailwind CSS;
- shadcn/ui primitives;
- Lucide React;
- feature-oriented `src/` structure;
- UniPrep visual identity;
- landing page;
- demo dashboard;
- placeholder routes;
- loading/error/not-found states;
- environment example;
- README documentation.

Expected structure:

```text
src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── academic/
│   ├── questions/
│   ├── practice/
│   ├── exams/
│   ├── performance/
│   └── admin/
├── lib/
│   ├── supabase/
│   ├── validations/
│   └── utils/
└── types/
```

Preserve this architecture.

---

## 6. Phase 1A.1 — UI/UX refinement

The initial scaffold was refined because it looked too simple/flat.

The landing page now includes:
- refined hero;
- examination photograph;
- warm overlay;
- improved typography;
- Core Features;
- Question Types;
- academic ecosystem section;
- How It Works;
- Final CTA;
- improved section rhythm;
- restrained interaction effects.

Academic ecosystem:

```text
University → Faculty → Department → Course → Topic
```

Do not invent fake university/course data.

Hero image:

```text
public/images/hero-exam.jpg
```

The uploaded examination photograph is used there. The implementation uses `next/image`.

Visual personality:

**Warm academic + modern technology**

- Landing: cinematic, warm, aspirational.
- Dashboard: friendly, data-driven, motivating.
- Exam: minimal, focused, serious.
- Admin: dense, professional, functional.

Avoid excessive glassmorphism, gradients, giant rounded cards, shadows, animations, or clutter. Performance matters on low-end devices/mobile networks.

---

## 7. Visual design system

Core palette:

```text
Deep Espresso  #32180C
Warm Brown     #7A4B33
Terracotta     #A86F4F
Warm Ivory     #F4F0E9
Soft Cream     #FFFDF8
Muted Teal     #4F9A9A
Charcoal       #241F1C
Warm Gray      #756D66
Sand           #DDD4C9
```

Semantic success/warning/error colors should remain distinct.

Typography:
- Fraunces for serif/display accents.
- Inter for general UI/body text.

---

## 8. Current navigation

Internal navigation uses Next.js `Link`.

Header:

```text
Logo           → /
Courses        → /courses
Practice       → /practice
Exams          → /exams
Performance    → /performance
Login          → /login
Sign Up        → /signup
```

Landing page:

```text
Start Practicing       → /practice
Explore Courses        → /courses
Practice feature       → /practice
Exam Simulation        → /exams
Performance Tracking   → /performance
Final CTA              → /signup
```

The mobile header has an accessible slide-in menu using the existing Radix Dialog dependency.

---

## 9. Current routes

```text
/
/login
/signup
/forgot-password
/reset-password
/dashboard
/courses
/practice
/exams
/performance
/profile
/admin
```

Pages other than the landing page and demo dashboard are currently placeholders.

They have contextual:
- page titles;
- breadcrumbs;
- future-phase badges;
- CTAs;
- back navigation.

The dashboard is explicitly a demo preview and must not imply real statistics. Do not add fake persistent data.

---

## 10. Phase 1B — Supabase foundation

Installed:

```text
@supabase/ssr ^0.12.5
@supabase/supabase-js ^2.111.0
```

Expected files:

```text
src/lib/supabase/env.ts
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/middleware.ts
src/middleware.ts
```

There is also Supabase documentation under `src/lib/supabase/`.

Architecture:
- browser client for Client Components;
- server client for Server Components, Server Actions and Route Handlers;
- cookie handling using current `getAll`/`setAll`;
- environment validation;
- middleware/session-refresh foundation.

Middleware:
- refreshes Supabase session infrastructure;
- does not enforce authentication;
- does not redirect users;
- should gracefully no-op if environment variables are absent.

---

## 11. Environment variables

Preferred/newer names:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SECRET_KEY
```

Legacy compatibility:

```text
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Never commit real credentials.

Never expose:

```text
SUPABASE_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY
```

to browser/client code.

`.env.local` must remain untracked.

---

## 12. Validation history

The original AI environment could not access the npm registry, so it could not reliably run:

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

It performed static checks instead.

The actual development environment should always be used for real validation. Do not claim checks passed unless they were actually run.

An earlier build error was:

```text
Error: Cannot find module 'autoprefixer'
```

Fixed with:

```bash
npm install -D autoprefixer
```

The Next.js 14.2.15 outdated warning was not the cause of that failure.

Do not upgrade Next.js merely because of that warning unless deliberately required.

---

## 13. Planned database architecture

Supabase PostgreSQL is planned.

### Academic

```text
universities
faculties
departments
academic_levels
courses
topics
```

Relationships:

```text
university
  └── faculty
       └── department
            └── course
                 └── topic
```

### Profiles

Supabase Auth handles authentication.

`profiles` is planned with:
- auth/user ID;
- full name;
- university;
- faculty;
- department;
- academic level;
- matriculation number;
- avatar;
- role;
- active status;
- timestamps.

Roles:

```text
student
reviewer
admin
super_admin
```

New users default to `student`. Users must not self-escalate.

---

## 14. Question system

Planned:

```text
questions
question_options
question_accepted_answers
question_sources
question_versions
```

Question types:

```text
multiple choice
true/false
fill in the blank
```

Questions are associated with course/topic/difficulty/source/status and creator/reviewer/version history.

Questions should be database-backed, not hardcoded.

---

## 15. Assessment system

Planned:

```text
tests
test_configurations
test_questions
exam_sessions
exam_answers
practice_sessions
practice_answers
```

Configurable:
- question count;
- duration;
- randomization;
- calculator;
- navigation;
- question review;
- result visibility;
- attempt limits.

---

## 16. Examination integrity

Planned:

```text
exam_events
```

Events may include:

```text
fullscreen_enter
fullscreen_exit
tab_switch
window_blur
window_focus
copy_attempt
paste_attempt
cut_attempt
keyboard_shortcut
connection_lost
connection_restored
exam_submitted
time_expired
```

Critical security requirement:

**Correct answers must not be sent to the browser during an active examination merely so the client can score answers.**

Privileged scoring/exam operations should be protected server-side/database-side as appropriate.

---

## 17. Student features

Planned:

```text
question_reports
bookmarks
performance_snapshots
topic_performance
course_performance
ai_explanations
```

Students should eventually be able to:
- bookmark questions;
- report incorrect questions/answers;
- view performance;
- see topic/course strengths and weaknesses;
- see accuracy;
- see answering speed;
- receive AI-assisted explanations in practice mode.

---

## 18. Import system

Planned:

```text
question_imports
```

Future workflow may support:
- PDF;
- DOCX;
- CSV;
- question extraction;
- review;
- approval/rejection;
- insertion into the question bank.

Imported questions should not become published blindly; admin/reviewer review is intended.

---

## 19. Admin

Planned:

```text
admin_actions
```

Future functionality:
- academic structure management;
- question bank;
- import/review;
- reports;
- tests;
- attempts;
- integrity events;
- users;
- analytics;
- settings.

Admin UI should be dense, professional and functional.

---

## 20. RLS/security requirements

RLS is a core requirement.

Students should only access their own private:
- profile;
- exam sessions;
- exam answers;
- practice sessions/answers;
- bookmarks;
- reports;
- performance;
- AI explanations.

Students may read appropriate active academic structures and published questions.

Students must not modify:
- questions;
- correct answers;
- test configurations;
- scores;
- integrity records;
- other users' private data.

Reviewer/admin/super-admin access must be appropriately protected.

Do not rely only on frontend role checks.

Privileged operations must be protected server-side/database-side.

---

## 21. Demo data

A demo academic structure was proposed using:

```text
Federal University of Technology, Akure (FUTA)
```

It must be clearly treated as **demo data, not official institutional data** unless verified later.

A demo course proposed is:

```text
EEE 304 — Electromagnetism II
```

with demo topics and sample questions.

Do not imply demo academic data is official.

---

## 22. Development phases

```text
Phase 0
Project specification
        ↓
Phase 1A
Project foundation
        ↓
Phase 1A.1
UI/UX refinement + navigation
        ↓
Phase 1B
Supabase integration foundation
        ↓
Phase 2
Database + Authentication + Profiles + RLS
        ↓
Phase 3
Question Bank
        ↓
Phase 4
Practice Engine
        ↓
Phase 5
Exam Engine
        ↓
Phase 6
Performance + Analytics
        ↓
Phase 7
Admin Dashboard
        ↓
Phase 8
Question Import + AI explanations + hardening
```

Do not jump several phases ahead without reviewing the current implementation.

---

## 23. Next phase — Phase 2

Phase 2 should handle:
1. Supabase PostgreSQL schema.
2. Migration(s).
3. Academic hierarchy.
4. Profiles.
5. Roles.
6. Authentication foundation.
7. RLS policies.
8. Privileged-data security.
9. Constraints/indexes.
10. Appropriate demo seed data.

Follow `PROJECT_SPEC.md`. Do not invent a substantially different schema without explaining why.

The user is not experienced with databases, so do not ask them to manually create dozens of tables one by one. Prefer a controlled SQL migration that can be applied to the Supabase project.

---

## 24. Phase 2 security priorities

Explicitly reason about:
- `auth.users` vs `profiles`;
- role enforcement;
- ownership policies;
- published-question visibility;
- answer-key protection;
- exam-session ownership;
- question versioning;
- reviewer/admin access;
- server-only privileged operations;
- service-role key exposure;
- foreign keys;
- unique constraints;
- indexes;
- deletion/cascade behavior.

---

## 25. Development rules

### Always
- inspect the repository first;
- read `PROJECT_SPEC.md`;
- preserve completed work;
- use reusable components;
- keep strict TypeScript;
- prefer server components where appropriate;
- prioritize mobile/low-end performance;
- run typecheck/lint/build after meaningful changes;
- report exactly what changed;
- distinguish implemented features from placeholders.

### Never
- rebuild from scratch;
- delete completed functionality without reason;
- add fake persistent data;
- expose Supabase secrets;
- expose correct answers unnecessarily during active exams;
- trust client-side role checks for authorization;
- introduce unnecessary dependencies;
- silently change the database architecture;
- claim validation passed if it was not run;
- continue past a phase with unresolved errors.

---

## 26. Working method

For each phase:

```text
Read specification
      ↓
Inspect existing implementation
      ↓
Plan changes
      ↓
Implement
      ↓
Run typecheck
      ↓
Run lint
      ↓
Run build
      ↓
Manual-test relevant feature
      ↓
Fix errors
      ↓
Report changes
      ↓
Stop at phase boundary
```

Avoid building the entire application in one prompt.

---

## 27. Immediate instruction to the new AI agent

You are taking over an existing UniPrep repository.

**Do not start coding immediately.**

First:

1. Read `PROJECT_SPEC.md`.
2. Read `UNIPREP_HANDOFF.md`.
3. Inspect the repository tree.
4. Identify what is actually present rather than assuming this document is perfectly synchronized.
5. Confirm versions from `package.json`.
6. Confirm Supabase utility files.
7. Confirm route structure.
8. Confirm Phase 1A/1A.1 UI work remains intact.
9. Identify discrepancies between this handoff and the actual repository.
10. Run available validation commands.

Then report:
- current project state;
- discrepancies;
- validation results;
- whether the repository is ready for Phase 2.

**Do not begin Phase 2 until the inspection is complete and the current state has been reported.**

When Phase 2 is explicitly authorized, implement the database/authentication foundation according to `PROJECT_SPEC.md` and this handoff.

---

## 28. Guiding principle

UniPrep should evolve from a polished frontend foundation into a secure, database-backed university examination platform.

Prioritize **correctness, maintainability, security, incremental implementation, and a strong mobile experience** over maximum feature count in a single development pass.
