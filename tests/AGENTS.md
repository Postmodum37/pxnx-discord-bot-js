# TESTS - BOT TEST SUITE

Bun native test runner. Two tiers: unit (fast, isolated) and integration (requires Searchy).

## OVERVIEW

9 test files. Unit tests in `utils/`, integration tests in `integration/`. Integration tests auto-start Searchy via preload script.

## STRUCTURE

```
tests/
├── setup/
│   └── searchyLifecycle.ts          # Preload: auto-starts/stops Searchy for integration tests
├── utils/                            # Unit tests (no external deps)
│   ├── validation.test.ts            # validateString, validateGuildId, validateVoiceChannel
│   ├── logger.test.ts                # Logger output and levels
│   └── randomElement.test.ts         # Array random selection
└── integration/                      # Integration tests (need Searchy running)
    ├── playCommand.test.ts           # Play command: defer → search → editReply flow
    ├── playCommandFlow.test.ts       # End-to-end user interaction flow
    ├── playCommandSignatureError.test.ts  # Service error differentiation
    ├── errorHandling.test.ts         # SearchyService error categorization
    ├── queueService.test.ts          # Queue operations with live Searchy
    └── audioPlayerManager.test.ts    # AudioPlayer lifecycle
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Add unit test | `utils/{module}.test.ts` | Import from `../../utils/`, use `bun:test` |
| Add integration test | `integration/{feature}.test.ts` | Runs with `bun run test:integration` |
| Modify test lifecycle | `setup/searchyLifecycle.ts` | beforeAll/afterAll for Searchy process |
| Mock Discord interaction | `integration/playCommand.test.ts` | Full mock pattern with flow tracking |

## CONVENTIONS

### Unit Test Pattern
```typescript
import { describe, expect, it } from "bun:test";
import { myFunction } from "../../utils/myModule";

describe("Module name", () => {
  it("should do thing", () => {
    expect(myFunction(input)).toBe(expected);
  });
});
```

### Integration Test Pattern
```typescript
import { describe, expect, mock, test } from "bun:test";
// Mock Discord interactions manually — no mocking library
const mockInteraction = { user: { id: "123" }, ... };
```

### Singleton Reset Between Tests
```typescript
beforeEach(() => {
  (SearchyService as any).instance = null;
});
```

## COMMANDS

```bash
bun run test              # Unit tests only (tests/utils/)
bun run test:integration  # Integration (auto-starts Searchy via preload)
bun run test:all          # Both unit + integration
bun run test:watch        # Watch mode
bun test tests/utils/validation.test.ts  # Single file
```

## ANTI-PATTERNS

- **Never** mock Searchy in integration tests — use real HTTP calls
- **Never** forget singleton reset in `beforeEach` when testing services
- **Avoid** testing Discord API interactions that need extensive mocking

## NOTES

- Integration tests need `uv` installed (for Searchy auto-start)
- Searchy dir expected at `../searchy` relative to bot project
- If Searchy already running on :8000, tests reuse it (no restart)
- 30s health-check timeout for Searchy startup
- TDD workflow preferred: write test → make it pass → refactor
