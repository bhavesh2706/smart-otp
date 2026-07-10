# Project Status — react-native-smart-otp

_Last updated: 2026-06-25_

A snapshot of what's built, verified, and outstanding. Source of truth for the
design is [`deep-research-report.md`](deep-research-report.md); the milestone
checklist lives in [`ROADMAP.md`](ROADMAP.md).

## TL;DR

- **All six milestones complete + post-release add-ons.** Production-ready.
- **Zero runtime dependencies.** Core bundle **3.26 kB** brotli (full API 5.34 kB).
- **85 tests** (unit + component + a11y + native-mocked), all green.
- **Device-verified** on a physical Samsung and an Android emulator, New
  Architecture (Fabric + Bridgeless).

## Quality gates (all passing)

| Gate | Status |
| --- | --- |
| `tsc --noEmit` (strict, no `any`) | ✅ |
| ESLint | ✅ |
| Prettier | ✅ |
| Jest (85 tests) | ✅ |
| `bob build` (CJS + ESM + d.ts) | ✅ |
| `size-limit` (core ≤ 4 kB / full ≤ 7 kB) | ✅ 3.26 / 5.34 kB |
| Android Gradle `assembleDebug` (Kotlin compiles) | ✅ (device) |

## Milestones

| # | Scope | Status |
| --- | --- | --- |
| M1 | Core `SmartOTPInput` (controlled/uncontrolled, mask, types, ref, a11y, autofill props) | ✅ |
| M2 | `useCountdown`, `useClipboardPaste`, `extractOTP`, React Hook Form integration | ✅ |
| M3 | Android SMS Retriever + User Consent (Kotlin TurboModule) + Expo config plugin | ✅ |
| M4 | Capability layer (`getOtpCapabilities`), `useOtpAutofill`; iOS = no native (oneTimeCode) | ✅ |
| M5 | Themes (Outlined/Filled/Minimal) + provider, error/success animations, `renderCell`, reduce-motion | ✅ |
| M6 | Example app, CI (gates + Gradle), size-limit, semantic-release, governance docs | ✅ |
| + | Tap-to-edit any cell (`editableCells`) + visible blinking caret | ✅ |
| + | Senior review pass: theme-memo perf fix, a11y announce, dev warning | ✅ |

## Feature checklist

- **Input:** numeric / alphanumeric, masking, placeholder, `length`, controlled &
  uncontrolled, `onChange` / `onComplete`, imperative ref
  (`focus`/`blur`/`clear`/`setValue`).
- **Editing:** tap any cell to overwrite that digit; visible blinking caret in the
  active cell (steady under Reduce Motion).
- **Auto-fill:** iOS `oneTimeCode`; Android SMS Retriever + User Consent (native,
  permission-free); clipboard detection; one `useOtpAutofill` hook composing all.
- **UX:** three themes + provider context, error shake, success pop, dark mode, RTL,
  Dynamic Type, custom `renderCell`.
- **Hooks:** `useCountdown`, `useClipboardPaste`, `useSmsRetriever`, `useSmsHash`,
  `useOtpCapabilities`, `useOtpAutofill`, `useReduceMotion`, `useOtpFeedback`.
- **Architecture:** single hidden `TextInput` + decorative cells; New Architecture
  (Fabric / TurboModules); graceful degradation everywhere native is absent.

## Device verification

Ran the kitchen-sink example ([`example/App.tsx`](example/App.tsx)) — all 10
sections interaction-tested on an Android emulator (New Arch):

1. Verify (green/“Verified”, red + shake) · 2. Ref API · 3. Masked PIN ·
4. Alphanumeric · 5. Placeholder · 6. Theme switch · 7. Live toggles ·
8. Resend timer · 9. Custom cells · 10. Clipboard auto-fill (extracted `987654`
from “Your code is 987654”, both on button and on app launch).

Native `androidSmsRetriever: true` confirmed at runtime.

## Engineering notes (from the review pass)

- **Perf:** the resolved `theme` is memoized — `getDefaultTheme()` returns a fresh
  object, so without the memo each `OTPCell`'s `React.memo` was defeated.
- **Accessibility:** the hidden input carries the label + live value; `error` /
  `success` are announced (`accessibilityLiveRegion` on Android,
  `AccessibilityInfo.announceForAccessibility` on iOS).
- **Error handling:** all async paths handled (clipboard `.catch`, SMS hooks →
  `onError`, native wrapper rejects with `SmartOtpUnavailableError`); no leaks
  (every effect cleans up its listeners/timers).

## Outstanding / not blocking

- Latest perf + a11y work is on branch **`perf/a11y-review-pass`** (not merged to
  `main` yet).
- iOS ships no native code by design; a future iOS-specific module is unnecessary.
- CI's Android Gradle job has been run locally/on device but not yet on a hosted
  GitHub runner.
- Optional, deferred (cosmetic / low value): single persistent animated cursor,
  hosted docs site, Detox/Maestro E2E.

## Repository layout

```
src/            library source (components, hooks, native bridge, themes, utils)
android/        Kotlin TurboModule (SMS Retriever + User Consent)
example/        Expo kitchen-sink demo (links the lib from source)
app.plugin.js   Expo config plugin
.github/        CI + release workflows, issue/PR templates, dependabot
```
