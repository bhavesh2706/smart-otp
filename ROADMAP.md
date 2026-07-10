# react-native-smart-otp — Roadmap (v1.1 → v2)

v1.0 shipped. This roadmap tracks the **growth phase**: turning a complete OTP
input into the reference library. Same bar as before — each milestone is
production-ready (TS strict, ESLint, Prettier, tests, docs), additive (no
breaking changes), zero new **required** deps, and holds the size budget.

**Legend:** ✅ done · 🚧 in progress · ⬜ pending

---

## ✅ Shipped — v1.0 (M1–M6)

Core `SmartOTPInput` (controlled/uncontrolled, mask, types, ref, tap-to-edit,
visible caret) · iOS `oneTimeCode` + Android SMS Retriever/User Consent (Kotlin
TurboModule) + clipboard auto-fill · `useCountdown`, `useClipboardPaste`,
`useSmsRetriever`, `useSmsHash`, `useOtpAutofill`, capabilities · 3 themes +
provider + `createTheme` + `fontFamily` · error shake / success pop · `renderCell`
· a11y (live region + announce) · New Architecture · CI/CD · 87 tests · core
**3.3 kB** brotli. Device-verified on Android (Fabric/Bridgeless).

_Full v1.0 milestone history: see git log and `CHANGELOG.md`._

---

## Phase 1 — Premium feel (Next)

### 🚧 M7 — i18n / configurable strings (v1.1)
- [ ] `SmartOTPLabels` type + defaults: input label, progress, per-cell label, error/success announcements
- [ ] `labels` prop on `SmartOTPInput`; app-wide via `SmartOTPProvider`
- [ ] Wire every hardcoded English string through `labels`
- [ ] Tests (custom labels applied, announcement uses custom string) + README/CHANGELOG
- [ ] Closes report gap: non-English a11y

### ✅ M8 — Built-in async verify + loading (v1.1)
- [x] `onVerify?: (code) => Promise<boolean>` — auto loading → success/error
- [x] `loading` prop + dimmed cells + spinner overlay (`renderLoading` slot) + typing blocked
- [x] State machine: idle → verifying → success | error; reset on edit; stale-result guard
- [x] `onError` on rejection; `accessibilityState.busy`; merges with controlled props
- [x] Tests (resolve true/false, reject, loading lock) + docs · closes report's loading gap

**Gate:** TSC ✅ · ESLint ✅ · Prettier ✅ · 97 tests ✅ · build ✅ · size 3.68 kB

### ⬜ M9 — `useOtpController` headless hook (v1.1)
- [ ] Expose controller (value, cells, activeIndex, commit, inputProps, ref) as a hook
- [ ] `SmartOTPInput` refactored to consume it (no behavior change)
- [ ] Docs: build a fully custom UI with the hook
- [ ] Composition-over-config win for design systems

### ⬜ M10 — `<OtpResendTimer>` component (v1.1)
- [ ] Bundles `useCountdown` + resend button (render-prop + default UI)
- [ ] Themable, accessible, i18n via M7 labels
- [ ] Tests + docs · closes report's "resend component"

### ⬜ M11 — Group separators (v1.1)
- [ ] `groups?: number[]` (e.g. `[3,3]` → `123-456`) + `separator?` node/string
- [ ] Layout + caret math respects gaps; a11y unaffected
- [ ] Tests + docs

---

## Phase 2 — Reach & polish (Later)

### ⬜ M12 — Web support (v1.2)
- [ ] Arrow/tab cell navigation (`onKeyPress`), `role="group"`, `ariaLabelArray`
- [ ] RN-Web verified · closes report web gaps

### ⬜ M13 — Input polish (v1.2)
- [ ] Optional haptics (`expo-haptics` optional peer) on complete/error
- [ ] Mask reveal delay (show digit briefly then bullet)
- [ ] Caret customization (color/width/blink) + high-contrast theme

### ⬜ M14 — Animation & form adapters (v1.2)
- [ ] Optional Reanimated adapter (Animated stays default)
- [ ] Formik adapter + Zod validation example

---

## Phase 3 — Ecosystem & quality (v2)

### ⬜ M15 — Docs & E2E
- [ ] Docs site (Docusaurus) + Expo Snack + Storybook for the example
- [ ] Detox/Maestro E2E, perf benchmark test, `api-extractor` API-stability gate
- [ ] Per-cell `testID`s for consumer E2E

---

## Cross-cutting invariants (every milestone)

- TS strict, no `any`, `readonly` props, exhaustive switches
- Functional components + hooks only; logic out of UI; native isolated
- Additive only — no breaking changes; graceful degradation everywhere
- No new **required** runtime deps (haptics/reanimated/clipboard = optional peers)
- A11y + dark mode + RTL + i18n from day one
- Hold size budget (core ≤ 6 kB after Phase 1); JSDoc + README + CHANGELOG per milestone
- Stop and wait for approval after each milestone
