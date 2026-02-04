# New Codebase Conventions

## Stack

- **Framework**: Next.js (App Router) deployed on Vercel
- **Styling**: Use the provided Pico CSS framework. See https://picocss.com/docs for documentation. 
- **Database**: We need to migrate an existing MySQL on RDS database to Neon (serverless Postgres).
- **ORM**: Prisma
- **Auth**: To be selected. The previous site had hand-rolled auth; the new site 
- **Payments**: Stripe (to be migrated from legacy PayPal integration)
- **Hosting/CI**: This project will be deployed on Vercel via Github.
- **Testing**: This project uses Jest.

## Conventions

- Use `/src/components` directory for reusable React components (e.g. UI components), and add the path to tsconfig.json
- Use `/src/lib` directory for reusable library code (e.g. common functions), and add the path to tsconfig.json
- Use `/src/util` directory for utilities
- Create an reusable metadata block component and structure it for optimal modern SEO
- Migration scripts should go in the existing `scripts/` directory
- Ensure appropriate test coverage of all key business logic functions

## Migration-Specific Rules

- This codebase is a rewrite of a PHP application. The legacy code is in `../old/` for reference only.
- Do not port PHP patterns into the new codebase. Translate the *behaviour*, not the *implementation*.
- Use the conventions of this starter and the Next.js App Router idiomatically, even where the legacy code did things differently.
- Server Actions for mutations. API routes only where a distinct API endpoint is genuinely needed (e.g. PayPal webhooks).
- All database queries should go through the ORM. No raw SQL unless there is a specific performance reason.
- TypeScript throughout. No `any` types except where genuinely unavoidable (e.g. third-party library gaps).

## Code Style

- Prefer named exports over default exports (except for page/layout files where Next.js requires default).
- Collocate related files (component + its types + its tests in the same directory).
- Keep components small. Extract logic into hooks or utility functions.
- Use early returns to reduce nesting.

## User Interface and User Experience

- The website must cater well (responsively) to mobile and tablet users (as well as desktop), with modern accessibility standards
- Reproduce the old UI / design as far as possible in Pico, but don't over-complicate by trying to replicate it exactly.
- Create new CSS classes only as necessary and emphasise reusability and maintainability.
- One big but well-organised CSS file (making use of variables) is preferable to modules.
