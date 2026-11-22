# Daymark — U.S. landing page

A responsive, static marketing site rebranded from the supplied LoveConnect HTML into **Daymark**, with U.S.-focused copy, optimized local portrait assets, a no-gradient visual system, Vercel configuration, GitHub CI, and a country-aware redirect endpoint.

> The page is a landing-page package, not a working dating product. Member cards and app previews are illustrative. Connect the CTA destinations to your real application before launch.

## Project structure

```text
.
├── api/
│   └── redirect.js          # Country-aware CTA redirect function
├── public/
│   ├── index.html            # Landing page
│   └── assets/               # Optimized WebP images
├── tests/
│   └── redirect.test.js
├── .github/workflows/ci.yml  # GitHub Actions test workflow
├── .env.example
├── package.json
└── vercel.json
```

## Global redirect behavior

Every primary action links to `/api/redirect?action=<action>`. The function reads Vercel's `x-vercel-ip-country` request header and selects a destination in this order:

1. `REDIRECT_<ACTION>_<COUNTRY>` — for example, `REDIRECT_JOIN_US`
2. `REDIRECT_<ACTION>_DEFAULT`
3. `REDIRECT_<COUNTRY>_URL`
4. `REDIRECT_DEFAULT_URL`

Supported actions: `join`, `browse`, `chat`, `call`, `pricing`, and `contact`.

This uses approximate country-level IP geolocation supplied by Vercel. It does not request browser location permission and does not reveal a visitor's precise address. If Vercel does not provide a country header, the `DEFAULT` destination is used. Destinations are read only from environment variables; the endpoint does not accept arbitrary redirect URLs from query strings.

### Configure redirects in Vercel

1. Open your Vercel project.
2. Go to **Settings → Environment Variables**.
3. Add the variables from `.env.example` and replace `app.example.com` with your real app domain.
4. Apply them to Production (and Preview if needed), then redeploy.

At minimum, configure `REDIRECT_JOIN_US` and `REDIRECT_JOIN_DEFAULT`. Configure the other actions as well so every button has a real destination. If an action is not configured, the endpoint intentionally returns HTTP 503 instead of sending visitors to a placeholder or an unsafe URL.

## Deploy with GitHub → Vercel

### Recommended: Vercel Git integration

1. Create a new GitHub repository and push this folder to the `main` branch.
2. In Vercel, choose **Add New → Project** and import the GitHub repository.
3. Keep the project as a static site (Other framework preset). The `vercel.json` sets the output directory to `public`; no build command is required. The redirect function is in `api/`.
4. Add the redirect environment variables described above.
5. Deploy. Vercel will create preview deployments for pull requests and deploy production when changes reach the configured production branch.

The included GitHub Actions workflow runs `npm test` on pushes and pull requests. Vercel's Git integration handles the actual deployments.

### Local checks

Requires Node.js 18 or newer.

```bash
npm test
npx vercel dev
```

The Vercel country header is supplied on deployed requests. Local requests without that header use the `DEFAULT` environment variables. Copy `.env.example` to `.env.local` and replace the example URLs if you want to test redirects locally.

## Before launch

- Replace the example redirect URLs with real application routes.
- Confirm your product actually supports the features described on the landing page.
- Replace illustrative member photos and profile copy with consented, real assets before representing them as actual members.
- Add your production Privacy Policy, Terms, community guidelines, and support contact details.
- Confirm age-gating, moderation, reporting, and safety operations are implemented in the connected product.

## Brand note

**Daymark** is a working brand name for this variant. Complete trademark, domain, and app-store name checks before commercial launch.
