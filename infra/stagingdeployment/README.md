# CCDR web staging

Self-hosted Angular 22 SPA. Host nginx is not installed; this stack is its own nginx container.

The SPA calls `/api` and `/health` with relative URLs (same as `ng serve` + `proxy.conf.json`). This nginx proxies those paths to `ccdr-api:8080` on the `ccdr-staging` network, so the browser talks to one origin.

| URL | What |
| --- | --- |
| `http://ccdr.copass.in/` | Angular app on port 80 (FleetStalk nginx) |
| `http://<public-ip>:8081/` | Angular app (this container, direct) |
| `http://<public-ip>:8081/api/...` | proxied CCDR API |
| `http://<public-ip>:8081/health` | proxied API liveness |

Deploy **ccdrapi** first so `ccdr-staging-api` and network `ccdr-staging` exist.

```bash
docker compose up -d --build
```
