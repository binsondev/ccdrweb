# CCDR web staging

Self-hosted Angular 22 SPA. Host nginx is not installed; this stack is its own nginx container.

The SPA calls `/api` and `/health` with relative URLs (same as `ng serve` + `proxy.conf.json`). This nginx proxies those paths to `ccdr-api:8080` on the `ccdr-staging` network, so the browser talks to one origin. `/ag-ui/` is proxied to the `ccdr-agent` container, which maps a question onto the existing customer search. The staging deploy passes `GEMINI_API_KEY` from the repository secret and sets `GEMINI_MODEL` to `gemma-4-26b-a4b-it`. Without a key, the agent maps questions locally.

| URL | What |
| --- | --- |
| `http://coreextract.copass.in/` | Angular app on port 80 (FleetStalk nginx) |
| `http://<public-ip>:8081/` | Angular app (this container, direct) |
| `http://<public-ip>:8081/api/...` | proxied CCDR API |
| `http://<public-ip>:8081/health` | proxied API liveness |

Deploy **ccdrapi** first so `ccdr-staging-api` and network `ccdr-staging` exist.

```bash
docker compose up -d --build
```
