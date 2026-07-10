# react-native-smart-otp — Example

An Expo app demonstrating the library: themed OTP entry, error/success states,
a resend countdown, and unified auto-fill (`useOtpAutofill`) wiring Android SMS
+ clipboard. It links the library from the parent folder via Metro, so changes
to `../src` are picked up live.

Platform screen recordings (`assets/demo/*.gif`) — Android and iOS — are shown at
the top of the app and in the [root README](../README.md#demo).

## Run

```sh
npm install
# Development build (full native features):
npm run android   # physical device or emulator
npm run ios       # iPhone 17 Pro simulator (default)
# JS-only features also run in Expo Go / web:
npm run web
```

> **Android SMS** needs `expo run:android`, not Expo Go. **iOS** needs
> `expo run:ios` for the dev client; see [CONTRIBUTING.md](../CONTRIBUTING.md)
> if the app crashes at launch (ExpoModulesJSI embed). All other features
> degrade gracefully.

## What it shows

- Controlled `SmartOTPInput` with `onComplete` verification.
- `error` / `success` states with the built-in shake / pop animations.
- Theme switching (Outlined / Filled / Minimal).
- `useCountdown` resend timer.
- `useOtpAutofill` + a live capability readout.

For a React Hook Form binding, see the snippet in the root README's
"Form integration" section — `SmartOTPInput` is a controlled field, so it drops
into `<Controller>` with no adapter.
