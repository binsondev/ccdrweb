# CCDR frontend

Angular 22 SPA for the Central Customer Data Repository. Tenant admins define attributes; customers are bags of those values; Excel mappings and uploads never guess column order.

The UI is zoneless and signal-based (Angular signals, Signal Forms, NgRx Signal Store). Components use [Spartan UI](https://www.spartan.ng/) Helm primitives.

## Run locally

The API is expected at `http://127.0.0.1:7421`. The dev server proxies `/api` and `/health` there.

```bash
npm install
npm start
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317). Sign in with a seeded development user (for example `acme.admin@local`). There is no password store — local JWT issuance is `POST /api/dev/token`.

## MCP (Cursor Desktop)

This agent session cannot attach Angular CLI or Spartan MCP servers. For Cursor Desktop, `.cursor/mcp.json` already registers:

- `npx -y @angular/cli mcp`
- `npx -y @spartan-ng/mcp`

Enable those MCP servers in Cursor Settings if you want schematic and Spartan docs in chat.

## Stack

- Angular 22 (zoneless, standalone, native control flow)
- Tailwind CSS v4 + Spartan Helm (`libs/ui`)
- NgRx `@ngrx/signals`
- HTTP via `HttpClient` + functional interceptor (`Authorization`, `X-Tenant`)
