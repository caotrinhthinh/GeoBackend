# GeoBackend

## Run infrastructure with Docker

Project now includes `docker-compose.yml` for local PostgreSQL and Redis:

- PostgreSQL: `localhost:5432` (`postgres` / `Phattanphat1`, DB `geodb`)
- Redis: `localhost:6379`

Use these commands in `GeoBackend`:

- Start infrastructure + run migrations + seeders:
  - `npm run infra:up`
- Stop infrastructure:
  - `npm run infra:down`

If Docker services are already running and you only want to rerun DB setup:

- `npm run db:init`
