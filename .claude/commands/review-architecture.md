# Architecture Review

Run an architecture review on current changes.

## Instructions

1. Read `docs/engineering/HLD.md` for the system architecture
2. Read `.claude/instructions/api.md` for API conventions
3. Read `.claude/instructions/ui-ux.md` for UI patterns
4. Get the current diff: `git diff main...HEAD`
5. Review ALL changed files against these criteria:

### API Architecture
- [ ] Route → Handler → Service → DB pattern followed (handlers are thin)
- [ ] Business logic in services (not handlers, not routes)
- [ ] Response format matches convention (`{ success, data, meta }` or RFC 9457 error)
- [ ] Cursor-based pagination (not offset)
- [ ] Amounts in paisa (integer, never float)
- [ ] Endpoints match OpenAPI spec in `docs/engineering/openapi.yaml`

### Flutter Architecture
- [ ] State management uses chosen solution (from HLD)
- [ ] No business logic in widgets — use providers/services
- [ ] Theme tokens used (no hardcoded colors/sizes)
- [ ] Shared components reused (no inline styled duplicates)
- [ ] Navigation uses GoRouter patterns

### Code Quality
- [ ] No tight coupling between unrelated modules
- [ ] Shared types in `packages/shared/` (not duplicated across apps)
- [ ] No circular dependencies
- [ ] Error handling follows AppError pattern
- [ ] Functions are focused (single responsibility, not god functions)

### Patterns
- [ ] Consistent with existing codebase patterns
- [ ] No premature abstractions (3 uses before abstracting)
- [ ] No over-engineering (startup-lean, not enterprise)

6. Report findings as: PASS, WARN (tech debt noted), or FAIL (must fix)
7. For each FAIL, specify file, line, what's wrong, and the correct pattern
