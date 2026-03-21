# Jest Setup for Expo + React Native (Expo 54 / RN 0.81)

This document records the exact steps taken to add Jest testing to this project, including all files created and modified.

---

## Step 1: Install dev dependencies

```bash
npm install --save-dev jest jest-environment-jsdom ts-jest @types/jest @testing-library/react-native @testing-library/jest-native --legacy-peer-deps
```

This added the following to `devDependencies` in `package.json`:

```json
"@testing-library/jest-native": "^5.4.3",
"@testing-library/react-native": "^13.3.3",
"@types/jest": "^30.0.0",
"jest": "^30.3.0",
"jest-environment-jsdom": "^30.3.0",
"ts-jest": "^29.4.6"
```

> **Note:** `jest-environment-jsdom` must be installed separately — as of Jest 28 it is no longer bundled with Jest.

> **Note:** `--legacy-peer-deps` was needed due to peer dependency conflicts with React 19 / Expo 54.

---

## Step 2: Add npm scripts to `package.json`

Three scripts were added to the `"scripts"` section:

```json
"test": "jest",
"test:coverage": "jest --coverage",
"test:ci": "jest --coverage --ci"
```

The `test:ci` script is what the GitHub Actions workflow (`.github/workflows/build.yml`) calls via `npm run test:ci`.

---

## Step 3: Create `babel.config.js`

The project had no Babel config. One was created at the project root so that `babel-jest` can transform JSX/TSX files using Expo's preset.

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

> **Why:** Initially `ts-jest` was used as the transform, but it cannot handle JSX in `.tsx` files during coverage collection. Switching to `babel-jest` with `babel-preset-expo` resolved this — Expo's Babel preset includes JSX transform, TypeScript support, and React Native-specific transforms out of the box.

---

## Step 4: Create `jest.config.js`

```js
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['./jest-setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'constants/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(expo|expo-.*|@expo|react-native|@react-native|@react-navigation)/)',
  ],
};
```

Key decisions:

- **`testEnvironment: 'jsdom'`** — Simulates a browser DOM so React components can render in tests.
- **`moduleNameMapper`** — Maps the `@/` path alias (from `tsconfig.json`) so imports like `@/components/...` resolve correctly in tests.
- **`transform`** — Uses `babel-jest` for all `.ts`, `.tsx`, `.js`, `.jsx` files.
- **`collectCoverageFrom`** — Collects coverage from `app/`, `components/`, `hooks/`, `utils/`, and `constants/` directories, excluding `.d.ts` type declaration files.
- **`transformIgnorePatterns`** — By default Jest does not transform `node_modules`. This pattern tells Jest to transform Expo and React Native packages (which ship untranspiled ESM/JSX).

---

## Step 5: Create `jest-setup.js`

This file mocks native modules that don't exist in the jsdom environment:

```js
// jest-setup.js

// Mock react-native modules for jsdom test environment
jest.mock('react-native', () => ({
  Platform: { select: jest.fn((obj) => obj.web || obj.default) },
  StyleSheet: { create: (styles) => styles },
}));

jest.mock('expo-router', () => ({
  Link: ({ children }) => children,
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));
```

> **Why mocks are needed:** The test environment is `jsdom` (a simulated browser), not an actual React Native runtime. Native modules like `expo-haptics`, `expo-splash-screen`, and `react-native` platform APIs don't exist in this environment, so they must be mocked. Add more mocks here as you import additional native modules in your code.

---

## Step 6: Create a basic test

A sanity test was created at `app/__tests__/index.test.tsx`:

```tsx
// app/__tests__/index.test.tsx
import React from 'react';

describe('App', () => {
  it('should pass a basic sanity check', () => {
    expect(true).toBe(true);
  });

  it('should have correct math', () => {
    expect(1 + 1).toBe(2);
  });
});
```

This is intentionally minimal — its purpose is to verify the Jest pipeline works end-to-end (TypeScript compilation, module resolution, coverage collection).

---

## Summary of files changed/created

| File | Action | Purpose |
|---|---|---|
| `package.json` | Modified | Added `test`, `test:coverage`, `test:ci` scripts and testing devDependencies |
| `babel.config.js` | Created | Babel config with `babel-preset-expo` for JSX/TS transform |
| `jest.config.js` | Created | Jest configuration (jsdom, path aliases, coverage, transforms) |
| `jest-setup.js` | Created | Mocks for native modules in the jsdom test environment |
| `app/__tests__/index.test.tsx` | Created | Basic sanity test to verify the pipeline |

---

## Running tests

```bash
npm test               # Run tests
npm run test:coverage  # Run tests with coverage report
npm run test:ci        # Run tests with coverage in CI mode (used by GitHub Actions)
npx jest path/to/file  # Run a single test file
```

---

## Troubleshooting

### "Cannot find module 'X'" for a native/Expo module

Add a mock for it in `jest-setup.js`. Example:

```js
jest.mock('expo-some-module', () => ({
  someFunction: jest.fn(),
}));
```

### Coverage fails with "Support for the experimental syntax 'jsx' isn't currently enabled"

This means `babel-jest` isn't transforming the file. Check that:
1. `babel.config.js` exists at the project root with `babel-preset-expo`
2. `jest.config.js` has the `transform` entry for `babel-jest`
3. The file's directory isn't excluded by `transformIgnorePatterns`
