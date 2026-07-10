# react-native-smart-otp — Example

An Expo app demonstrating the library: themed OTP entry, error/success states,
a resend countdown, and unified auto-fill (`useOtpAutofill`) wiring Android SMS
+ clipboard. It links the library from the parent folder via Metro, so changes
to `../src` are picked up live.

## Run

```sh
npm install
# A development build is required for the native Android SMS module:
npm run android   # or: npm run ios
# JS-only features also run in Expo Go / web:
npm run web
```

> The Android SMS Retriever module needs a **Development Build** (`expo run:android`),
> not Expo Go. All other features (UI, themes, clipboard, iOS oneTimeCode,
> timer) work everywhere; unsupported capabilities degrade gracefully.

## What it shows

- Controlled `SmartOTPInput` with `onComplete` verification.
- `error` / `success` states with the built-in shake / pop animations.
- Theme switching (Outlined / Filled / Minimal).
- `useCountdown` resend timer.
- `useOtpAutofill` + a live capability readout.

For a React Hook Form binding, see the snippet in the root README's
"Form integration" section — `SmartOTPInput` is a controlled field, so it drops
into `<Controller>` with no adapter.
