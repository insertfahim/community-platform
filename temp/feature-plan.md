## Community Platform – Minimal Implementation Plan

### 1) Overview of current state

-   Stack: Node.js + Express, PostgreSQL via Neon DB
-   Implemented: Auth (token), Posts, Donations, Incidents, Learning, Messages, Events, Emergency contacts, Volunteers, Admin
-   Gaps vs guide: No distance scoring, limited verification signals, no categories table, no smart feed ranking, no real-time notifications

### 2) Overview of final state (minimal delta for this step)

-   Keep current stack; introduce:
    -   Smart feed ordering by urgency (priority) and recency
    -   Enriched `/api/users/me` with DB-backed user details (trust context)
    -   Frontend feed requests smart ordering

### 3) Files to change (what to change, not code)

-   `controllers/postController.js`: In `list`, support optional `sort=smart` query param that sorts posts by mapped priority (high/medium/low) then by `createdAt` desc.
-   `routes/authRoutes.js`: Update `/me` to fetch user from DB and return sanitized details (no password), including `name`, `email`, `role`, volunteer flags, timestamps.
-   `public/feed.html`: In the fetch for posts, include `sort=smart` param by default.

### 4) Checklist (2-level)

-   [ ] Backend
    -   [ ] Add smart sort in `postController.list`
    -   [ ] Enrich `/api/users/me` response with DB data
-   [ ] Frontend
    -   [ ] Add `sort=smart` to feed request in `public/feed.html`
-   [ ] Validation
    -   [ ] Smoke test: login, load feed, verify ordering and `/api/users/me` fields
