# Rajneesh App Notes (For AI Contributors)

This folder is the primary location for app-specific logic. Prefer adding new
features and behavior here, and keep changes to the core player files minimal.

Guidelines:
- Put new logic under `src/lib/rajneesh/` (hooks, stores, pages, helpers).
- Expose small helpers/hooks that core files can call.
- Minimize edits to non-`rajneesh` files and keep them thin (just wiring).
- If you must edit core code, do the smallest possible change and
  keep the behavior gated/isolated.

Analytics:
- PostHog setup lives in `src/lib/rajneesh/analytics/posthog.ts` with hardcoded
  credentials (API key/host) for easy updates.

Goal: keep app-specific behavior clear and isolated from the core player.
