# Trae Preflight

This folder is prepared for `wangxt-984-1`.

Use `.env` for stable local ports and compose project identity:

- APP_PORT: 18284
- API_PORT: 19284
- WEB_PORT: 20284
- DB_PORT: 21284
- REDIS_PORT: 22284

Smoke entry:

```bash
bash scripts/smoke.sh
```

The preflight files are environment scaffolding only. The generated business
project can replace or extend them when needed.
