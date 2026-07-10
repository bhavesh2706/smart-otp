# Contributing to react-native-smart-otp

Thanks for your interest in improving the project. This guide covers the
workflow, standards and tooling.

## Development setup

```sh
git clone https://github.com/bhavesh2706/smart-otp.git
cd smart-otp
npm install
```

### Example app

The kitchen-sink demo in [`example/`](example/) links the library from `../src`
via Metro, so library edits hot-reload without rebuilding the native app.

```sh
cd example
npm install

# Full feature set (Android SMS Retriever, clipboard, New Architecture):
npm run android   # physical device or emulator
npm run ios       # iPhone 17 Pro simulator (default)

# JS-only (themes, timer, iOS oneTimeCode) — Expo Go / web:
npm run start     # dev client, if already installed
npm run web
```

> **Android SMS** needs a **Development Build** (`expo run:android`), not Expo
> Go. Unsupported native capabilities degrade gracefully everywhere else.
>
> **iOS (Expo SDK 57):** the example `Podfile` includes a `post_install` hook
> that embeds `ExpoModulesJSI.framework` — without it the dev client crashes at
> launch. After changing native deps, run `cd ios && pod install` then
> `npm run ios`.
>
> Connect a device or emulator (`adb devices` / Xcode Simulator). After the
> first native build, `npm run start` in `example/` is enough for JS-only
> changes. Re-run `npm run android` / `ios` when native code or Expo config
> changes.

See [example/README.md](example/README.md) for what the demo covers.

## Quality gates

Every change must pass all gates before review. They mirror CI — run from the
**repo root**:

```sh
npm run typecheck   # tsc --noEmit, strict mode
npm run lint        # eslint (flat config: eslint.config.mjs)
npm run format      # prettier --check
npm test            # jest
npm run build       # react-native-builder-bob (CJS + ESM + d.ts)
npm run size        # size-limit (core ≤ 5 kB / full ≤ 8 kB brotli)
```

`npm run lint -- --fix` and `npx prettier --write "src/**/*.{ts,tsx}"` auto-fix
most issues.

For native or example changes, verify the example app on **both** platforms:

```sh
cd example && npm run android   # device or emulator
cd example && npm run ios       # simulator
```

## Coding standards

- TypeScript **strict**; no `any`, no ignored errors.
- Functional components and hooks only — no class components.
- `const` over `let`; `readonly` props; exhaustive `switch` statements.
- Business logic lives in hooks/utils, not UI components.
- Native code stays isolated; the JS surface must degrade gracefully when a
  native module is absent.
- Every exported API needs a JSDoc comment.
- No new **required** runtime dependencies without discussion. Optional native
  modules are optional peer dependencies, dynamically required.
- Additive, backward-compatible props and APIs — no breaking changes without a
  major release.

## Tests

- Co-locate tests in `__tests__` next to the code.
- Unit-test pure logic; component-test UI with React Native Testing Library
  (async `render` / `fireEvent` — await them).
- Mock native modules (see `src/native/__mocks__`).
- New features and bug fixes require tests.

## Commits & releases

This project uses [Conventional Commits](https://www.conventionalcommits.org/).
`semantic-release` derives the version and changelog from commit messages:

- `fix:` → patch
- `feat:` → minor
- `feat!:` / `BREAKING CHANGE:` → major

Examples: `feat(themes): add high-contrast variant`, `fix(sms): unregister
receiver on consent denial`, `docs: add iOS demo GIFs and refresh README`.

## Pull requests

1. Branch from `main`.
2. Keep PRs focused; describe the motivation and any trade-offs.
3. Ensure all gates pass and docs ([README](README.md) / [CHANGELOG](CHANGELOG.md))
   are updated when user-facing behavior changes.
4. Link any related issue.

## Architecture notes

The library favours composition over configuration. Key decisions (single hidden
`TextInput`, JS-side OTP extraction, iOS-needs-no-native, graceful degradation)
are documented in the [README](README.md). Read that and recent
[CHANGELOG](CHANGELOG.md) entries before large changes.

Repository layout:

```
src/            library source (components, hooks, native bridge, themes, utils)
android/        Kotlin TurboModule (SMS Retriever + User Consent)
example/        Expo kitchen-sink demo (links ../src via Metro)
docs/           README assets (Android + iOS demo GIFs)
example/ios/    Expo prebuild output (Podfile embed fix for ExpoModulesJSI)
app.plugin.js   Expo config plugin
```
