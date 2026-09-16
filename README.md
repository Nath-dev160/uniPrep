# UniPrep

A university-focused online practice and examination platform. Students
practice course questions and sit timed exam simulations; admins manage
the question bank and academic content behind them.

Full product and architecture details live in [`PROJECT_SPEC.md`](./PROJECT_SPEC.md)
at the repo root — read that first for anything beyond this README.

## Current status: Phase 1A — Project foundation

This is the **UI and project-structure foundation only**. Specifically, at
this stage:

- ✅ Next.js + TypeScript + Tailwind + shadcn/ui are set up
- ✅ The brand design system (colors, type, layout) is in place
- ✅ The landing page and a demo dashboard shell exist
- ✅ All top-level routes exist as placeholder pages
- ❌ **No database.** Supabase/PostgreSQL is not connected.
- ❌ **No authentication.** Login/signup pages are visual only — nothing is wired up.
- ❌ **No exam engine, question bank, AI explanations, or admin functionality.**

Every placeholder page says so on-screen — nothing here should be mistaken
for working functionality yet.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) + [TypeScript](https://www.typescriptlang.org/) (strict mode)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) components
- [Lucide React](https://lucide.dev/) icons
- Planned for later phases: [Supabase](https://supabase.com/) (PostgreSQL + Auth), [Zod](https://zod.dev/), [React Hook Form](https://react-hook-form.com/), [Recharts](https://recharts.org/)

## Project structure

```
src/
  app/            Next.js App Router routes
  components/
    ui/           Base design-system components (button, card, input, ...)
    layout/        Header, footer, and shared page shells
    marketing/      Landing-page sections
  features/        One folder per product area (auth, academic, questions,
                    practice, exams, performance, admin) — currently
                    placeholders; real logic lands here phase by phase
  lib/
    supabase/       Supabase client setup (not implemented yet)
    validations/     Zod schemas (not implemented yet)
    utils.ts        Shared helpers (currently: the `cn` class-merge helper)
  types/            Shared hand-written TypeScript types
public/
  images/
    hero-exam.jpg   Landing page hero photograph
```

## Getting started

**Requirements:** Node.js 18.18+ (Node 20 LTS recommended) and npm.

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment template (Supabase isn't connected yet,
#    but the file documents what's coming in Phase 2)
cp .env.example .env.local

# 3. Run the development server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build |
| `npm start` | Run a production build (after `npm run build`) |
| `npm run lint` | Run ESLint (`next/core-web-vitals`) |
| `npm run typecheck` | Run `tsc --noEmit` (strict TypeScript check) |

## Environment variables

See [`.env.example`](./.env.example). All variables are Supabase
placeholders for Phase 2 — none are required for Phase 1A, since nothing
in this codebase reads them yet.

## Design system

Brand colors, typography, and the hero treatment are documented in
`PROJECT_SPEC.md` (Section 22) and implemented as CSS variables in
`src/app/globals.css` plus Tailwind tokens in `tailwind.config.ts`.
Headings use Fraunces (serif); body/UI text uses Inter (sans).

## Next phase

Phase 2, per `PROJECT_SPEC.md`, is the database and authentication
foundation: the Supabase project and PostgreSQL schema for every entity in
Section 16, Row Level Security policies per Section 17, Supabase Auth
wiring, and the `profiles` table.
