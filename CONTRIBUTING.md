# Contributing to react-native-smart-otp

Thanks for your interest in improving the project. This guide covers the
workflow, standards and tooling.

## Development setup

```sh
git clone https://github.com/seaculum/react-native-smart-otp.git
cd react-native-smart-otp
npm install
```

Run the example app (Expo, works for CLI and Expo consumers):

```sh
cd example
npm install
npm run start    # then press a (Android) or i (iOS)
```

## Quality gates

Every change must pass all gates before review. They mirror CI:

```sh
npm run typecheck   # tsc --noEmit, strict mode
npm run lint        # eslint
npm run format      # prettier --check
npm test            # jest
npm run build       # react-native-builder-bob
```

`npm run lint -- --fix` and `npx prettier --write` auto-fix most issues.

## Coding standards

- TypeScript **strict**; no `any`, no ignored errors.
- Functional components and hooks only — no class components.
- `const` over `let`; `readonly` props; exhaustive `switch` statements.
- Business logic lives in hooks/utils, not UI components.
- Native code stays isolated; the JS surface must degrade gracefully when a
  native module is absent.
- Every exported API needs a JSDoc comment.
- No new runtime dependencies without discussion. Optional native modules are
  optional peer dependencies, dynamically required.

## Tests

- Co-locate tests in `__tests__` next to the code.
- Unit-test pure logic; component-test UI with React Native Testing Library;
  mock native modules (see `src/native/__mocks__`).
- New features and bug fixes require tests.

## Commits & releases

This project uses [Conventional Commits](https://www.conventionalcommits.org/).
`semantic-release` derives the version and changelog from commit messages:

- `fix:` → patch
- `feat:` → minor
- `feat!:` / `BREAKING CHANGE:` → major

Examples: `feat(themes): add high-contrast variant`, `fix(sms): unregister
receiver on consent denial`.

## Pull requests

1. Branch from `main`.
2. Keep PRs focused; describe the motivation and any trade-offs.
3. Ensure all gates pass and docs (README/CHANGELOG) are updated.
4. Link any related issue.

## Architecture notes

The library favours composition over configuration. Key decisions (single
hidden `TextInput`, JS-side OTP extraction, iOS-needs-no-native) are documented
in the README and `ROADMAP.md` — read those before large changes.
