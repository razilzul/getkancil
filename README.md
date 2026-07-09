# Kancil landing site — `getkancil.app`

Static site (no build step). Serves the marketing page plus the three store-required pages:
`/` · `/privacy/` · `/terms/` · `/support/`. Directory-index layout so the extensionless
URLs the app links to (`/privacy`, `/terms`) resolve on GitHub Pages without Jekyll config.

## Deploy (GitHub Pages pattern — playbook §1)

The app repo is private, so publish this folder from a **separate public repo** (Pages needs
a public repo on the free plan). Two options:

- **Simplest:** create a public repo `kancil-web` (or `getkancil`), copy the contents of this
  `landing/` folder to its root, push to `main`, then repo Settings → Pages → Source = `main` /
  root. The `CNAME` file (already present, contains `getkancil.app`) sets the custom domain.
- **Or** keep it here and push just this subtree with a Pages Action. Copy-to-a-public-repo is
  the low-friction path and matches how the other RZee landing pages are hosted.

`.nojekyll` is included so nothing is run server-side; the files are served as-is.

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
- At store launch, replace the "Coming soon" store buttons in `index.html` with the real
  App Store / Play links.

## Interim fallback

Until DNS propagates, the `razilzul.github.io/<repo>/` URL works and is accepted by both stores
as the privacy/support URL — swap to the custom domain later without app resubmission.
