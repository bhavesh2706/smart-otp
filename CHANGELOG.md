# Changelog

All notable changes to **react-native-smart-otp** are documented here. The
format follows [Keep a Changelog](https://keepachangelog.com/) and the project
adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- **iOS New Architecture: cells were untappable / not editable.** Root cause: on
  iOS a single-line `TextInput` ignores the `height` style, so the hidden input
  rendered as a ~1px-tall hit strip — taps missed it and never focused the field
  (only `ref.focus()` and typing kept working, since they don't need a hit
  frame). Fix: the touch is now caught by a transparent **`View` overlay** sized
  to the cells (width/height from the cell metrics); a plain View honors its
  height, so taps land, focus the input, and position the caret. Verified on the
  iOS 26 simulator (RN 0.85): tap an empty field → keyboard rises → typing fills
  the cells.
- **Android native module wouldn't compile on React Native 0.85.** The SMS
  auto-fill module (`SmartOtpModule.kt`) used pre-0.85 `ActivityEventListener`
  signatures (`onActivityResult(activity: Activity?, …)`, `onNewIntent(intent:
  Intent?)`) and read `currentActivity` off the module base. RN 0.85 made those
  callback params non-null and dropped the base accessor. Updated the overrides
  to non-null params and switched to `reactApplicationContext.currentActivity`.
  Android now builds clean on RN 0.85 (verified on a physical Android 16 device:
  type → complete/verify, tap a cell → caret + overwrite).
- **New-Architecture hardening (RN 0.85 / Fabric).** Moved the shake/pop
  `transform` off the cell row onto the root container (a transformed view
  creates a Fabric stacking context that can paint over later siblings), and
  moved every `pointerEvents: 'none'` from the deprecated **prop** to **style**
  (the prop form isn't honored on Fabric).

### Example

- **Upgraded to Expo SDK 56 / React Native 0.85.3 / React 19** (from SDK 52 / RN
  0.76.9), plus latest `react-hook-form` 7.80, `@react-native-clipboard/clipboard`
  1.16, Babel 7.29, TypeScript 6. RN ≥0.77 fixes the iOS-26 `AccessibilityManager`
  keyboard crash natively, so the old RN 0.76 patch was dropped. Native projects
  regenerated via `expo prebuild --clean`.
- **Patched `expo-modules-jsi` 56.0.10 for Swift 6.2 / Xcode 26.1** — its JSI
  bridge declared `weak let`, which Swift 6.2.1 rejects (weak must be mutable);
  changed to `nonisolated(unsafe) weak var` (keeps `Sendable` conformance).
  Persisted via `patch-package` (`example/patches/expo-modules-jsi+56.0.10.patch`,
  applied on `postinstall`). iOS now builds clean (0 errors) and the keyboard no
  longer crashes the app. Demo-only; the library is unaffected (peer-dep `*`).

### Added

- `onFocus` / `onBlur` props on `SmartOTPInput` — enables keyboard-avoidance
  (scroll the focused input above the keyboard) and other focus-driven UI. The
  example wires `onFocus` to a measure-and-scroll helper inside its `ScrollView`.

### Fixed

- **iOS: keyboard covered an input low on the screen.** Android auto-resizes the
  window (`adjustResize`); iOS does not scroll a custom input above the keyboard.
  Documented the pattern (`ScrollView` + the new `onFocus` → `scrollTo`) and
  applied it in the example so a tapped cell stays visible above the keyboard.

- **Editing the wrong box with repeated digits.** The reconciler located edits by
  diffing the old/new strings, which is ambiguous when digits repeat — deleting a
  middle box in `555555`, or box 4 of `233446`, cleared/shifted the wrong cell.
  The edit position is now derived from the **controlled selection** (the cell the
  component actually targeted) instead of a string diff, so the exact tapped cell
  is cleared/overwritten and trailing equal digits keep their slots. Verified on a
  physical Android device; reconciler is platform-agnostic so iOS is fixed too.

- **Backspace now clears boxes one-by-one on iOS and Android (caret no longer
  sticks / deletes the wrong box).** Positional editing needs a predictable caret,
  but a persistent *range* selection jams iOS and releasing the selection entirely
  left the OS caret unpredictable (wrong box deleted on Android, stuck on iOS).
  The caret is now parked **collapsed at the end of the content** after every edit
  — the OS-natural position (no iOS jam) — so backspace deterministically removes
  the last character and the reconciler clears the last filled box; repeated
  backspace empties the field box-by-box through holes. A tap still sets a
  transient range to target a specific cell. Verified on a physical Android device;
  tests cover both hole layouts. (Supersedes the earlier selection-release fix.)


- **iOS: cells were untappable.** The hidden input used `opacity: 0`, but iOS
  UIKit hit-testing ignores any view with alpha < 0.01, so taps fell straight
  through it and no cell could be focused or edited (Android delivers touches to
  0-opacity views, so it worked there). The input now uses `opacity: 0.02` —
  still imperceptible, but hit-testable on iOS. Regression test added.


- **Positional cell editing.** Clearing a middle cell (e.g. deleting box 3 of a
  filled 6-digit code) now empties only that cell and leaves boxes 4–6 in place,
  instead of sliding the trailing digits left. Emptied middle cells are
  represented in `value` by a space; `onComplete` still receives the compact
  code, and the new `stripHoles(value)` export returns it on demand. Set
  `editableCells={false}` for the previous contiguous-string behavior.
  Verified on a physical Android device.


### Added — built-in async verify + loading (M8)

- `onVerify?: (code) => Promise<boolean>` — on completion the component runs a
  `idle → verifying → success | error` flow automatically: spinner overlay, dimmed
  cells, typing blocked while pending; success on `true`, error on `false` or
  rejection; resets to idle on edit. Stale results (edited mid-flight) are ignored.
- `loading` prop (force the loading state), `renderLoading` (custom indicator,
  default themed `ActivityIndicator`), `onError` (called on rejection).
- Controlled `loading` / `error` / `success` merge with the internal verify state.
  Loading sets `accessibilityState.busy`.
- 4 new tests (verify success/error/reject, forced loading). Closes the report's
  loading-state gap.

### Added — i18n / configurable strings (M7)

- All screen-reader strings are now localizable via a `labels` prop
  (`SmartOTPLabels`): `input(length)`, `progress(entered, length)`,
  `cell(index, length, filled)`, `errorAnnouncement`, `successAnnouncement`.
- App-wide labels via `SmartOTPProvider` (`labels` prop) — per-input `labels`
  win over the provider, which wins over the English `DEFAULT_LABELS`.
- New exports: `SmartOTPLabels`, `SmartOTPLabelsInput`, `DEFAULT_LABELS`,
  `resolveLabels`, `useSmartOTPLabels`.
- `SmartOTPProvider.theme` is now optional (labels-only providers are allowed).
- 6 new tests. Closes the report's non-English accessibility gap.

### Added — dynamic fonts & easier theming

- `theme.fontFamily` for custom fonts; `theme.fontWeight` is now **optional** and
  applied only when set. On iOS a custom typeface's weight comes from a weighted
  family name (e.g. `"Inter-SemiBold"`), so custom-font users set `fontFamily`
  and leave `fontWeight` undefined. The default (system font, `"600"`) is
  unchanged and works cross-platform.
- `createTheme(base, overrides)` helper — override any theme field with a shallow
  merge of `colors`, so you don't restate the whole theme. New
  `SmartOTPThemeOverrides` type.

### Performance & accessibility (senior review pass)

- **Fixed a re-render bug:** the resolved `theme` was rebuilt every render
  (`getDefaultTheme` returns a fresh object), changing the `theme` prop identity
  and defeating each `OTPCell`'s `React.memo`. It is now memoized, so typing into
  one cell no longer re-renders the others.
- Screen readers now announce verification outcomes: `accessibilityLiveRegion`
  on the input (Android) plus `AccessibilityInfo.announceForAccessibility`
  on the rising edge of `error` / `success` (covers iOS).
- Added a `__DEV__` warning when `length` is not a positive integer.

### Added — tap-to-edit any cell + visible caret

- **Visible blinking caret** rendered in the active cell (the real input caret is
  hidden). Shows where the next keystroke lands — a steady bar when "Reduce
  Motion" is on. The caret moves to whichever cell you tap; a filled active cell
  shows the digit plus the caret (`5|`).
- `editableCells` prop (default `true`): tap any cell to position the caret on
  that digit so the next keystroke overwrites it — including mid-string and on a
  full field (a replace, not blocked by `maxLength`). Set `false` to restore
  end-of-string caret behavior. The single-hidden-input architecture (and its
  atomic autofill) is preserved: the caret is positioned from the tap's
  `locationX` on the input itself, so focus/keyboard stay reliable.
- New internal `Cursor` component; caret color follows the theme's focus color.
- 7 new tests (caret positioning, clamping, disabled, mid-string overwrite,
  caret rendering in empty/filled active cells, Cursor).
- Verified on-device (physical Samsung + Android emulator).

### Added — Milestone 6 (tooling, example & release)

- Runnable Expo example app in `example/` (themes, states, resend timer,
  `useOtpAutofill`, capability readout), linking the library from source.
- GitHub Actions CI: typecheck, lint, format, test (+coverage), build,
  `npm pack`, `size-limit`, and an Android Gradle `assembleDebug` that compiles
  the Kotlin module against the example app.
- `size-limit` budgets (`.size-limit.json`): core `SmartOTPInput` ≤ 4 kB,
  full API ≤ 7 kB (current: 2.7 kB / 4.8 kB brotli).
- `semantic-release` config (`.releaserc.json`) + release workflow.
- Governance: `LICENSE` (MIT), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, issue
  and PR templates, Dependabot (npm + actions + gradle).

### Changed

- Bumped `@testing-library/react-native` 12 → 13.

### Fixed — on-device verification (real Android device, New Architecture)

- **Config plugin resolution:** added `"./app.plugin.js"` to the package
  `exports` map and made `app.plugin.js` dependency-free (`(config) => config`),
  so `expo prebuild` resolves it instead of falling back to the TS source.
- **Android build:** removed the AGP / Kotlin Gradle plugin classpath pins from
  the library `build.gradle` — the host app provides them, and pinning could
  force a Kotlin version that conflicts with the host (e.g. Expo's Compose
  compiler).
- **SMS events:** construct `NativeEventEmitter` without the module argument
  (events arrive via the global `RCTDeviceEventEmitter`), removing RN's
  "called without the required addListener method" warning.

Verified on a physical device with Fabric/Bridgeless: build + Kotlin compile +
install, OTP entry, success/error states + animations, all three themes, resend
timer, and `androidSmsRetriever: true` (native TurboModule live).

### Added — Milestone 5 (themes, animations & custom cells)

- Built-in themes `getOutlinedTheme` / `getFilledTheme` / `getMinimalTheme` with
  a `variant` field (`'box' | 'filled' | 'underline'`) and `SmartOTPVariant` type.
- `SmartOTPProvider` + `useSmartOTPTheme` theme context (per-input `theme` wins).
- `success` prop and `'success'` cell state with `borderSuccess` / `surface`
  theme colors and `cellSuccessStyle` override.
- `error`-shake and `success`-pop micro-animations on the native driver, gated by
  the `animated` prop and the OS "Reduce Motion" setting.
- `useReduceMotion()` hook and `useOtpFeedback()` animation primitive.
- `renderCell` prop + `OTPCellRenderInfo` for fully custom cell rendering.
- Perf: memoized per-cell gap style; cells remain `React.memo`-isolated.
- 13 new tests (themes, variants, success/error states, custom cells, context,
  animation primitives).

### Added — Milestone 4 (capabilities & unified autofill)

- `getOtpCapabilities()` / `useOtpCapabilities()` — runtime support snapshot
  (`iosOneTimeCode`, `androidSmsRetriever`, `androidSmsUserConsent`, `clipboard`).
- `useOtpAutofill({ length, onCode, sms, clipboard, ... })` — one hook composing
  Android SMS detection + clipboard detection into a single `onCode` callback,
  each source degrading independently.
- Platform support matrix in the README.
- 7 new tests (capabilities snapshot, unified-autofill SMS + clipboard paths,
  enable/disable, user-consent config).

### Changed

- **iOS ships no native code.** iOS OTP autofill is delivered entirely through
  the keyboard `oneTimeCode` content type (already set by `SmartOTPInput`);
  Apple forbids reading SMS. Removed the placeholder podspec and `ios` packaging
  entries — nothing to link or `pod install` on iOS.

### Added — Milestone 3 (Android SMS native)

- Android **SMS Retriever** + **SMS User Consent** native module (Kotlin
  TurboModule via codegen spec `RNSmartOtpSpec`). No SMS permission required.
- `useSmsRetriever({ length, onReceived, method, ... })` hook — arms the flow,
  extracts the OTP from the SMS body, cleans up listeners on unmount.
- `useSmsHash()` hook — resolves the 11-char app-signature hash for SMS routing.
- `SmartOtp` graceful-degradation wrapper, `isSmsRetrieverSupported()`,
  `SmartOtpUnavailableError`, `SmsReceivedPayload` / `SmsErrorPayload`.
- Expo config plugin (`app.plugin.js`) — autolinks in Development Builds;
  degrades to no-op in Expo Go / on iOS.
- Android Gradle build, permission-free manifest, `AppSignatureHelper`,
  `SmsBroadcastReceiver`, `SmartOtpModule`, `SmartOtpPackage`.
- iOS podspec placeholder (no sources yet; iOS uses keyboard `oneTimeCode`).
- 13 new tests via a manual native mock (hash, retriever, user-consent, events,
  cleanup, graceful degrade). Optional `@react-native-clipboard/clipboard` now
  declared as an optional peer dependency.

### Added — Milestone 2 (hooks & forms)

- `useCountdown({ duration, onExpire, autoStart })` resend timer →
  `{ timeLeft, isRunning, start, pause, reset }`. Leak-free (clears on
  pause/expiry/unmount).
- `useClipboardPaste({ length, onDetect, ... })` clipboard auto-fill. Reads on
  mount + app-foreground (avoids iOS paste-banner spam); opt-in `pollInterval`;
  deduplicated detections; injectable `getClipboardString` reader.
- `extractOTP(text, type, length)` — pull an exact-length code from free-form
  text (e.g. an SMS body).
- Optional clipboard support via `@react-native-clipboard/clipboard` (optional
  peer dependency) with graceful no-op fallback; `isClipboardSupported()` /
  `defaultClipboardReader` / `ClipboardReader` exports.
- React Hook Form `Controller` integration (no adapter needed) — proven by tests.
- 20 new tests (timer fake-timers, clipboard detection, RHF binding, extraction).

### Fixed

- `useCountdown` no longer reset `timeLeft` back to `duration` when the timer
  paused or expired (idle re-sync now keys on `duration` changes only).

### Added — Milestone 1 (core input)

- `SmartOTPInput` component with controlled and uncontrolled modes.
- Single hidden `TextInput` architecture for atomic paste / autofill.
- Numeric and alphanumeric input types with keystroke sanitization.
- `onChange` / `onComplete` callbacks; `onComplete` fires exactly once per code.
- Imperative `SmartOTPInputRef` (`focus`, `blur`, `clear`, `setValue`).
- Masking (`mask`, `maskSymbol`), error and disabled states.
- iOS `oneTimeCode` and Android `sms-otp` autofill via `autoCompleteType`.
- Built-in light/dark theme (`getDefaultTheme`) and design tokens.
- Accessibility: single accessible field with live value, Dynamic Type, RTL.
- Presentational `OTPCell` and pure `sanitizeOTP` / `toCells` utilities.
- Full Jest + React Native Testing Library suite (24 tests).
