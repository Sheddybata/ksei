# King Solomon Empowerment Initiative

Unified public site, education management suite, and student learning portal.

LEARN. LEAD. EMPOWER.

## Run locally

```bash
npm install
npm run db:setup
npm run dev
```

Open http://localhost:3000.

The local database is SQLite (`prisma/dev.db`). To use PostgreSQL or Supabase, set `provider = "postgresql"` in `prisma/schema.prisma`, set `DATABASE_URL`, and run `npm run db:setup`. A matching SQL script is in `prisma/supabase.sql`.

## Demonstration access

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@ksei.org.ng | Empower2026! |
| Instructor | instructor@ksei.org.ng | Lead2026! |
| Livelihood departments | livelihood@ksei.org.ng | Lead2026! |
| Student | ada.okonkwo@ksei.org.ng | Learn2026! |

The administrator account is named for Dr. Juliet Ebine, Administrator, King Solomon Initiative. Sample trainee records are portal demonstrations. They are not the participants in the admission-letter report. Departmental modules and handbooks come from the documents in `public/programes` and `public/resources`.
