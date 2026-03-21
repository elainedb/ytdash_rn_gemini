# GEMINI.md

This file provides guidance to Gemini CLI when working with code in this repository.

## Project Overview

Expo + React Native app with Google Sign-In authentication that displays YouTube videos from specified channels. Features include video feed with filtering/sorting, local AsyncStorage caching, and a map view showing video recording locations.

## Build & Run Commands

```bash
npm start              # Start Expo dev server
npm run android        # Build & run on Android
npm run ios            # Build & run on iOS
npm run web            # Run web version
npm run lint           # ESLint
npm test               # Jest tests
npm run test:coverage  # Tests with coverage report
npm run test:ci        # CI: coverage, no watch
npx jest path/to/file.test.ts  # Run single test file
```

## Configuration

Sensitive config files are gitignored. For local development:
- `config.json` — YouTube API key (`youtubeApiKey`) and authorized email list (`authorizedEmails`)
- `google-services.json` — Android Firebase/Google Sign-In config

Additional configuration:
- Path alias: `@/` maps to project root (configured in `tsconfig.json`)
- TypeScript strict mode enabled, extends `expo/tsconfig.base`
- ESLint uses Expo's flat config (ESLint 9+)
- New Architecture and React Compiler are enabled

## Architecture

**Expo 54 + React Native 0.81** app.

**Routing**: Expo Router (file-based) in `app/`. Stack navigation: `login → main → map`.

**Key screens**:
- `app/login.tsx` — Google Sign-In, validates against email whitelist from `config.json`
- `app/main.tsx` — FlatList of videos with filter/sort modals, pull-to-refresh, cache-first loading
- `app/map.tsx` — Leaflet.js map in WebView showing geolocated videos, with a bottom sheet for video details

**Services layer** (`services/`):
- `youtubeApi.ts` — YouTube Data API v3 client. Fetches from 4 hardcoded channel IDs, extracts location metadata, reverse-geocodes via OpenStreetMap Nominatim (rate-limited 1 req/sec)
- `cacheService.ts` — AsyncStorage wrapper with 24-hour TTL

### Key Patterns

- **State management**: Local React state (useState/useEffect). No external state library.
- **Caching**: AsyncStorage with 24-hour TTL. Service layer falls back to cache when remote fails.
- **Theming**: Custom themed components (`components/themed-text.tsx`, `themed-view.tsx`) with light/dark mode support via `hooks/use-color-scheme.ts`.
- **Networking**: Direct fetch calls to YouTube Data API v3. Reverse geocoding via OpenStreetMap Nominatim with rate limiting.

## Testing

Jest with ts-jest and `@testing-library/react-native`. Test environment is jsdom. Tests live alongside source files (`*.test.ts(x)`). Coverage collects from `app/`, `components/`, `hooks/`, `utils/`, `constants/`.

`jest-setup.js` mocks react-native and expo modules for the web-based test environment.

## CI/CD

GitHub Actions (`.github/workflows/build.yml`): checkout → npm ci → test → lint → SonarCloud scan. Runs on pushes to main and PRs.

## Key Dependencies

- expo + react-native for cross-platform UI
- expo-router for file-based navigation
- @react-native-async-storage/async-storage for caching
- expo-auth-session + expo-web-browser for Google Sign-In
- react-native-webview for Leaflet.js map integration
- @gorhom/bottom-sheet for map video details
