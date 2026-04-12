# E0.3 — Authentication

## Overview
Implement passwordless authentication: Firebase Phone OTP + Google/Apple OAuth on Flutter, server-side JWT verification in Hono, session management (90-day mobile / 30-day web), guest browsing with soft auth wall, and audit logging. This epic gates all protected features.

## SRS Requirements
- IAM-FR-001 (Phone OTP sign-up/sign-in)
- IAM-FR-002 (Session management)
- IAM-FR-005 (Social login: Google, Apple)
- IAM-FR-010 (Guest browsing)
- IAM-FR-011 (Soft auth wall)
- IAM-FR-012 (OAuth permissions transparency card)

## Dependencies
- E0.1 (monorepo scaffold)
- E0.2 (users table, audit_events table)

## Architecture Decisions
- Firebase Auth handles OTP delivery (MSG91), DLT compliance — we verify the JWT server-side only
- App session tokens (not Firebase tokens) used for API calls after initial registration
- Mobile: `flutter_secure_storage` for tokens, 90-day rolling session
- Web: HttpOnly cookies, 30-day session
- Guest browsing: `optionalAuthenticate` middleware passes `userId: null`
- Soft auth wall: bottom sheet on Flutter, triggered client-side on protected actions

## Deliverables
1. Hono auth middleware (`authenticate`, `optionalAuthenticate`, `requireCreator`, `requireKYC`)
2. Auth routes: `POST /auth/register`, `POST /auth/refresh`, `POST /auth/sign-out`
3. Auth service: Firebase JWT verification, user upsert, token generation
4. Flutter auth flow: Phone OTP screen, Google/Apple sign-in
5. Flutter auth state management (Riverpod)
6. Soft auth wall bottom sheet component
7. Guest browsing support (no forced sign-up)
8. OAuth permissions transparency card
9. Audit event logging for sign-in, sign-out, device changes
