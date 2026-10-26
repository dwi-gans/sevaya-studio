# integrations

Boundary to external providers, one folder per capability (for example `payment`, `shipping`, `messaging`, `storage`).

- Each capability defines a provider-agnostic interface and exports it from `index.ts`.
- Each provider lives in its own adapter file that implements the interface.
- The active provider is selected in one place (the capability's `index.ts`), driven by environment variables.
- Must not import from `app`, `features`, or `components` (enforced by ESLint).
