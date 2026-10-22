# Public release checklist

This export removes the detected credentials from both Wrangler configs and removes bundled ZIP archives and macOS metadata. It is a **new snapshot**, not a cleaned Git history.

1. **Rotate/revoke** the original R2 API credentials, Turnstile secret, and HMAC secret before publishing.
2. Set `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `TURNSTILE_SECRET_KEY`, and `HMAC_SECRET` as **Cloudflare Pages secrets** for the project (and each relevant environment). Do not put them under `[vars]` in `wrangler.toml`.
3. For local development, copy `.dev.vars.example` to `.dev.vars` and enter newly issued values; never commit `.dev.vars`.
4. Check the existing Cloudflare deployment bindings, including D1 and R2 resource names/IDs, before deploying.
5. Publish using a **fresh repository with no imported Git history**, or separately rewrite and verify existing Git history.
6. Perform a final secret scan and review application behavior/dependencies before public release. This export is not a security audit.
