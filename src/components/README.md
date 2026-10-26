# components

Shared, presentational UI used by `app/` and `features/`.

- Receives data via props; no data fetching, no business logic.
- Must not import from `features`, `integrations`, or `app` (enforced by ESLint).
- Planned: `ui/` (primitives such as button, input) and `layout/` (header, footer, page shell).
