# features

One folder per business capability (for example `catalog`, `cart`, `checkout`, `orders`, `account`).

- Owns that capability's types, logic, data access contracts, and feature-specific components.
- Exposes a small public API through `index.ts`; other code imports only from there.
- May import from `components`, `integrations`, and `config`. Must not import from `app` (enforced by ESLint).
