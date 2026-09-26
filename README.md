# Kancil landing site — `getkancil.app`

Static site (no build step). Serves the marketing page plus the three store-required pages:
`/` · `/privacy/` · `/terms/` · `/support/`. Directory-index layout so the extensionless
URLs the app links to (`/privacy`, `/terms`) resolve on GitHub Pages without Jekyll config.

## Deploy status — PUBLISHED 2026-07-09

This folder is the **source of truth**. It is published to the public repo
**`razilzul/getkancil`** → GitHub Pages, custom domain `getkancil.app` (CNAME picked up,
build = `built`, HTTPS not yet enforced — pending DNS). Only the DNS records below remain.

**Sync workflow — `landing/` is the only place to edit the site:**
```bash
scripts/sync-site.sh "what changed"   # PR + merge on razilzul/getkancil, no force-push
```
Never edit razilzul/getkancil directly and never `git push -f` there. The old
"git init + push -f" steps rewrote the site's history on every sync, so every
existing clone diverged (fixed 2026-09-26). Site-only changes that land there
anyway must be copied back into `landing/` or the next sync deletes them.
`.nojekyll` is included so nothing is run server-side; the files are served as-is.
After DNS resolves: getkancil repo → Settings → Pages → tick **Enforce HTTPS**.

## 🔒 Namecheap DNS records (owner action)

Domain is already owned in the owner's Namecheap account. In **Domain List → getkancil.app →
Advanced DNS**, set exactly these (delete any parked/placeholder `@` A record and the default
CNAME first). **Do not touch MX records** — email breaks silently (playbook).

| Type | Host | Value | TTL |
|---|---|---|---|
| A Record | `@` | `185.199.108.153` | Automatic |
| A Record | `@` | `185.199.109.153` | Automatic |
| A Record | `@` | `185.199.110.153` | Automatic |
| A Record | `@` | `185.199.111.153` | Automatic |
| CNAME Record | `www` | `razilzul.github.io.` | Automatic |

Optional IPv6 (recommended, add alongside the A records):

| Type | Host | Value |
|---|---|---|
| AAAA Record | `@` | `2606:50c0:8000::153` |
| AAAA Record | `@` | `2606:50c0:8001::153` |
| AAAA Record | `@` | `2606:50c0:8002::153` |
| AAAA Record | `@` | `2606:50c0:8003::153` |

Then in the Pages repo Settings → Pages: set custom domain `getkancil.app`, wait for the DNS
check to pass, and tick **Enforce HTTPS**. Propagation is usually minutes, up to a few hours.

## Before publish 🔒

- Set the **effective date** on `/privacy` and `/terms` (replace `[set on publication]`).
- Confirm the public contact email (currently `razil.zul@gmail.com` — swap for an alias if wanted).
- Keep both store buttons non-clickable until their public listings resolve. The App Store build is
  approved but held for manual release; Google Play is still in closed testing. After launch, link
  App Store id `6789944706` and the production listing for `com.rzeestudios.kancil`.

## Interim fallback

Until DNS propagates, the `razilzul.github.io/<repo>/` URL works and is accepted by both stores
as the privacy/support URL — swap to the custom domain later without app resubmission.
