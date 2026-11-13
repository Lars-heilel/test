# URL Download Benchmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** NestJS console app that measures download speed over 10 sequential HTTP requests and prints average request time, total bytes, and speed.

**Architecture:** NestJS standalone application context. `BenchmarkModule` owns download I/O and metric aggregation; `CliModule` owns argument parsing, reporting, and exit codes. `fetch` and console output are injected via DI tokens so tests need no global patching. Tests use a real local HTTP server.

**Tech Stack:** NestJS 11, TypeScript 5.9 (strict), Node.js >= 20, Jest + ts-jest, zero runtime deps beyond Nest.

**Spec:** `specs/001-download-benchmark/spec.md`

## Global Constraints

- Exactly 10 sequential requests per run, each awaited to full body (FR-002).
- Units (stated in FR-006): time in ms; volume as B/KB/MB/GB decimal (1 KB = 1,000 bytes); speed in KB/s, MB/s, GB/s. Documented in README (FR-006, FR-008).
- Nonzero exit code when zero successful downloads (FR-007).
- Strict TypeScript; no network mocks in tests.

## Review Focus

1. Empty response body → no division by zero, speed reported as `н/д`.
2. HTTP 4xx/5xx → attempt failed, excluded from averages, exit 1 if all fail.
3. Network error / timeout → attempt fails with message, run does not hang.
4. URL without scheme or non-http(s) → clear validation error before any request.
5. Partial failures → averages over successes only; exit 0 with warning.

---

### Task 1: Aggregation and formatting

**Files:** `src/benchmark/summary.ts`, `src/benchmark/benchmark.types.ts`, `src/cli/report.formatter.ts`, `src/benchmark/summary.spec.ts`, `src/cli/report.formatter.spec.ts`

- [x] Tests for summarize (10 ok, partial, all failed, empty body).
- [x] Tests for decimal byte units, duration, report contents, N/A speed.
- [x] Implement pure functions.

### Task 2: Sequential runner

**Files:** `src/benchmark/benchmark.service.ts`, `src/benchmark/benchmark.module.ts`, `src/benchmark/benchmark.service.spec.ts`, `test-support/test-server.ts`

- [x] Real local server test: 10 requests, max concurrency 1, bytes total.
- [x] Tests: 500 responses, empty body, dead port, timeout.
- [x] Implement `BenchmarkService.run` with injected `FetchClient`, `AbortSignal.timeout`, full `arrayBuffer()` read.

### Task 3: CLI wiring, docs, publication

**Files:** `src/main.ts`, `src/app.module.ts`, `src/cli/*`, `test/cli.e2e-spec.ts`, `README.md`, `package.json`, `nest-cli.json`, `tsconfig*.json`

- [x] Parser tests (help, missing URL, bad scheme, valid URLs).
- [x] CLI service tests (help, errors, success, all failed, partial warning).
- [x] E2E: built CLI prints usage; downloads 10× from local server and prints metrics.
- [x] README with install, run, units, architecture.
- [ ] Init git repo and provide GitHub push instructions (no `gh` installed).
