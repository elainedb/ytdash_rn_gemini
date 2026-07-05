# Implementation Plan: YouTube Dashboard (ytdash)

**Input**: Feature specification from `spec/spec.md`

## Summary
A mobile app that authenticates users via Google Sign-In with a whitelist, fetches YouTube videos from configured channels, caches them locally, allows filtering/sorting, and displays located videos on a map.

## Technical Context
**Language/Version**: TypeScript / React Native 0.86 / Expo SDK 54
**Primary Dependencies**: 
- `expo-auth-session` / `expo-crypto` for authentication
- `zustand` for state management
- `@react-native-async-storage/async-storage` for local cache
- `react-native-webview` for the Leaflet map
- `expo-router` for navigation
**Storage**: Async Storage for caching the fetched videos JSON.
**Target Platform**: Android (via Expo)
**Project Type**: Mobile app

## Constitution Check
- Layered separation: Services for API/Storage, Zustand for domain logic, React components for presentation.
- Observable state: Zustand store provides loading/content/empty/error states.
- Offline support: App falls back to cache on network failure.
- Explicit error handling: Error views with retry buttons for API/Auth/Map.
- Dynamic Configuration: `uiTestMode`, `apiBaseUrl`, etc. read via custom Expo module.
- Selector contract: Expose exact `testID` on elements.
- Map markers: Leaflet map via WebView, plus native affordance chips below map for automated testing.

## Project Structure
```text
src/
├── app/               # expo-router pages
├── components/        # Reusable UI components
├── store/             # Zustand state management
├── services/          # API, Auth, Cache, Native Modules
└── types/             # TypeScript definitions
```

**Structure Decision**: Expo Router standard structure inside `src/`.
