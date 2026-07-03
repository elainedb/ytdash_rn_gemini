# Implementation Plan: YouTube Dashboard ("ytdash")

**Branch**: `main` | **Date**: 2026-07-03 | **Spec**: [spec/spec.md](file:///tmp/ytrun.od1g9M/workspace/spec/spec.md)

## Summary
The project is a React Native app built using Expo SDK 57 that displays YouTube videos from a configured set of source channels. It features secure Google Sign-In with an email whitelist, video caching for offline access, filtering/sorting capabilities, and an OpenStreetMap-based map displaying geolocated videos with marker detail views. It also implements a robust UI test mode to enable deterministic E2E testing via Maestro.

## Technical Context

- **Language/Version**: TypeScript, Node.js, Kotlin for native Android integration.
- **Primary Dependencies**:
  - `react`, `react-native`, `expo` (SDK 57)
  - `react-native-webview` (to embed the Leaflet OpenStreetMap view)
  - `@react-native-async-storage/async-storage` (for local video caching)
  - `@react-native-google-signin/google-signin` (for real Google Sign-In)
- **Storage**: AsyncStorage for lightweight JSON caching (no complex database required as there are only a few dozen videos).
- **Testing**: Jest for unit/integration logic; Maestro for black-box E2E validation against the mock API server.
- **Target Platform**: Android (minSdk 29, compileSdk 35/36 via Expo).
- **Project Type**: React Native Mobile App (Expo).
- **Performance Goals**: Instant startup, fluid scrolling list, offline fallback under 100ms.
- **Constraints**: Support cleartext traffic for local mock API (`http://10.0.2.2:8080`), must correctly read launch intent extras.

## Constitution Check

- **Layered separation**: Yes. We will separate code into distinct folders:
  - `src/services/` for YouTube API clients and geocoding.
  - `src/context/` or custom hooks for Auth and App state.
  - `src/components/` and `src/screens/` for presentation.
- **Dependency inversion**: Abstractions for API calls (e.g. `fetchVideos`) allow swapping between Mock and Real mode at runtime based on `TestConfig`.
- **Unidirectional, observable state**: App state manages a sealed view-state type: `status: 'idle' | 'loading' | 'success' | 'error'`.
- **No blocking work on UI thread**: Network/disk access are handled asynchronously via `AsyncStorage` and `fetch`.
- **Single source of truth**: The App State loads from AsyncStorage on start, pulls fresh data from the network, saves to AsyncStorage, and triggers re-renders.
- **Explicit error handling**: Any network/auth failure displays a beautiful `error_view` containing an `error_retry_button`.

## Project Structure

```text
/tmp/ytrun.od1g9M/workspace/
├── src/
│   ├── components/
│   │   ├── VideoCard.tsx
│   │   ├── BottomSheet.tsx
│   │   └── LeafletMap.tsx
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   └── MapScreen.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── cache.ts
│   │   └── geocode.ts
│   ├── utils/
│   │   └── TestConfig.ts
│   └── types.ts
├── App.tsx
├── app.json
├── package.json
└── tsconfig.json
```

**Structure Decision**: A clean single-project React Native architecture with modular subfolders under `src/` to separate concerns cleanly.

## Complexity Tracking

No violations of the Constitution. The architecture remains minimal, clean, and highly robust.
