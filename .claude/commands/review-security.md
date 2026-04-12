# Security Review

Run a security review on current changes.

## Instructions

1. Read `.claude/instructions/infosec.md` for the security checklist
2. Get the current diff: `git diff main...HEAD`
3. Review ALL changed files against OWASP Top 10:

### Check Each:

**Authentication & Authorization**
- [ ] Every endpoint uses `authenticate` or `optionalAuthenticate`
- [ ] Authorization checks prevent IDOR (queries scoped to user_id)
- [ ] Creator-only endpoints use `requireCreator`
- [ ] KYC-gated endpoints use `requireKYC`

**Input Validation**
- [ ] All request bodies validated with Zod schemas
- [ ] Path params and query params validated
- [ ] File upload MIME types validated server-side

**Injection**
- [ ] SQL queries use parameterized statements (no string concatenation)
- [ ] No raw user input in SQL, HTML, or shell commands

**Data Exposure**
- [ ] No secrets in code (API keys, tokens, passwords)
- [ ] PII not logged (phone, PAN, Aadhaar, bank details)
- [ ] Error responses don't expose stack traces or internal IDs
- [ ] PAN/Aadhaar masked in API responses

**Infrastructure**
- [ ] New tables have RLS policies
- [ ] Google Places API key not exposed to client
- [ ] Webhook signatures verified
- [ ] Rate limiting on new endpoints

4. Report findings as: PASS, WARN (non-blocking), or FAIL (must fix)
5. For each FAIL, specify the file, line, and fix needed
