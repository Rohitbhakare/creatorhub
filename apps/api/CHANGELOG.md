# Changelog — CreatorHub API

All API changes are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- Initial Hono API scaffold with `/healthz` and `/readyz` health endpoints
- CORS middleware configured for localhost + production
- AppError class with RFC 9457 Problem Details error format
- Global error handler
- Environment variable validation (Zod) on startup
- Firebase Admin SDK + Supabase client singletons
