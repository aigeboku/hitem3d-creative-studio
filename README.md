# hitem3d-creative-studio

Next.js App Router web app for:
- generating 3D models from images via HitEM3D
- taking 3D viewer screenshots
- generating new images with Gemini using those references

## Stack
- Next.js 16
- React 19
- TypeScript
- Zustand
- React Three Fiber / Drei
- shadcn/ui

## User flow (public usage)
1. Open `Settings`
2. Register your own HitEM3D Access Key / Secret Key credentials
3. Register your own Gemini API key
4. Upload image -> generate 3D -> take screenshots -> generate images

Credentials are stored in encrypted `HttpOnly` cookies per browser session context (not in `localStorage`).

## Local development
```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production deployment (Vercel recommended)
1. Push this repository to GitHub.
2. Import project into Vercel.
3. Set environment variables from `.env.example`.
4. Deploy.
5. Run smoke test:
   - open `/settings`
   - validate both credentials
   - complete one full wizard run

### Required environment variables
Create environment variables in your hosting platform:

- `CREDENTIALS_COOKIE_SECRET`
  - required in production
  - use a long random secret (32+ chars)
- `APP_ORIGIN`
  - public app origin, e.g. `https://your-domain.example`

### Optional environment variables
- `HITEM3D_BASE_URL` (default: `https://api.hitem3d.ai`)
- `HITEM3D_MODEL` (default: `hitem3dv1.5`)
- `HITEM3D_RESOLUTION` (default: `1024`; for `hitem3dv2.0` default is `1536`)
- `GEMINI_MODEL` (default: `gemini-3-pro-image-preview`)

## Security notes
- Outbound HitEM3D base URL is HTTPS-only.
- API routes enforce same-origin checks for mutating requests.
- API routes include rate limiting and payload validation.
- API responses for secrets/errors are sanitized.

## Operational notes
- Current rate limit storage is in-memory. It works for single-instance deployments.
- For high-traffic multi-instance deployments, move rate limiting to Redis/KV.

## CI
GitHub Actions workflow (`.github/workflows/ci.yml`) runs:
- lint
- typecheck
- production build

Local pre-check command:
```bash
npm run check
```
