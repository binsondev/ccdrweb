# CCDR frontend

Angular 22 SPA for the Central Customer Data Repository. Tenant Admin defines **record types**, then attributes and one Excel mapper per type. Customers are bags of those values. Search can omit type. Match keys never cross types.

The UI is zoneless and signal-based (Angular signals, Signal Forms, NgRx Signal Store). Components use [Spartan UI](https://www.spartan.ng/) Helm primitives.

## Run locally

The API is expected at `http://127.0.0.1:7421`. The dev server proxies `/api` and `/health` there.

```bash
npm install
npm start
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317). Sign in with email and password. The SPA stores the access token and refresh token, sends `Authorization: Bearer`, and refreshes on 401.

## Staging on this machine

GitHub Actions (`staging-deploy.yml`) builds a Docker image and serves the SPA from nginx on **port 8081**. That nginx also proxies `/api` and `/health` to `ccdr-api` (same origin as local `proxy.conf.json`). Deploy **ccdrapi** first.

- App (hostname on port 80): `http://ccdr.copass.in/`
- App (direct port): `http://<public-ip>:8081/`
- API (direct): `http://<public-ip>:7421/`

`ccdr.copass.in` is a `server_name` on the existing FleetStalk nginx (same public IP as `fleetstalk.com`). Point DNS `ccdr.copass.in` A → `103.177.26.199`.

The live app uses the enterprise Spartan theme (navy sidebar, Helm primitives, light/dark toggle). Customer search is faceted from catalog fields marked filterable. A mock-only playground remains at [http://127.0.0.1:4317/prototype/login](http://127.0.0.1:4317/prototype/login).

## MCP (Cursor Desktop)

This agent session cannot attach Angular CLI or Spartan MCP servers. For Cursor Desktop, `.cursor/mcp.json` already registers:

- `npx -y @angular/cli mcp`
- `npx -y @spartan-ng/mcp`

Enable those MCP servers in Cursor Settings if you want schematic and Spartan docs in chat.

## Stack

- Angular 22 (zoneless, standalone, native control flow)
- Tailwind CSS v4 + Spartan Helm (`libs/ui`)
- NgRx `@ngrx/signals`
- HTTP via `HttpClient` + functional interceptor (`Authorization`, `X-Tenant`, refresh on 401)
