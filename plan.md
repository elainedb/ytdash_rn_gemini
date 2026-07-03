# Implementation Plan: YouTube Dashboard ("ytdash") - React Native (Expo)

**Branch**: `main` | **Date**: 2026-07-03 | **Spec**: spec/spec.md

## Summary
Building a production-quality Android application for the **rn** (React Native/Expo) framework that integrates Google Sign-In with an email whitelist, aggregates YouTube videos from configured channels, handles offline caching, implements filtering/sorting, and displays geolocated videos on a Leaflet-in-WebView map with an accessible native marker overlay.

We will achieve a high quality bar and satisfy all 12 Acceptance Criteria (E2E validated using Maestro flows).

## Technical Context

- **Language/Version**: TypeScript, Expo SDK 57 (~57.0.2), React 19.2.3, React Native 0.86.0
- **Primary Dependencies**:
  - `react-native-webview` (for Leaflet OpenStreetMap)
  - `@react-native-async-storage/async-storage` (for offline video caching)
  - `test-config` (custom local Expo Native Module to read intent extras)
- **Storage**: `@react-native-async-storage/async-storage` (persisting aggregated videos as JSON with 24h TTL and stale fallback on network errors)
- **Testing**: Maestro E2E Flows (`flows/AC-*.yaml`)
- **Target Platform**: Android (compiled Release APK tested on device `25251FDF60029V`)
- **Project Type**: React Native Expo App (managed workflow with custom native module)
- **Constraints**: Cleartext HTTP traffic enabled for mock API, offline capability with stale cache fallback, absolute separation of concerns.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Selector Contract (MANDATORY)**: Fully honored using `testID` on React Native components (applied directly to pressables/touchables and titles).
- **UI Test Mode Contract (MANDATORY)**: Fully honored by reading launch intent extras via a custom Expo native module `TestConfig` and exposing them to the JS layer.
- **Map Marker Contract (MANDATORY)**: Expose both Leaflet HTML pins and a native overlay chip row carrying `map_marker` for automation tools.
- **Overlays/Popups**: Maintain test identifiers in the main tree or absolute overlays, avoiding the Compose/Dropdown separate window trap.
- **No Secrets**: No secrets in source control. Configurable API endpoints and runtime API key reading.

## Project Structure

We follow the standard single-project layout for Expo.

```text
/
├── App.tsx                     # App entry point (or navigation root)
├── index.ts                    # Expo root register
├── app.json                    # Expo config with android package & build properties
├── package.json                # Dependencies and scripts
├── config/
│   ├── channels.json           # Configured source channels (label -> category)
│   └── secrets.env             # Production env variables (gitignored)
├── flows/                      # Maestro E2E test flows
├── mock/                       # Local Python YouTube-Data-API mock server
├── modules/                    # Local Expo Native Modules
│   └── test-config/            # custom native module to read intent extras
│       ├── android/            # Kotlin android implementation
│       ├── src/                # TypeScript bindings
│       └── expo-module.config.json
├── spec/                       # Shared constitution and specs
└── plan.md                     # This plan
```

**Structure Decision**: Custom state hook at the root layer to pass app states (Loading, Error, Content, Filtered, Selected Video) via React Context, with standard views separated cleanly into components under `/components` or inline sections of `App.tsx` for atomic simplicity and absolute robustness.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Local Expo Native Module | Reading launch intent extras | Standard `Linking` only reads the deep link path and query parameters, not extras added to the Android launch intent. |
| Dual Marker Pattern | Leaflet Canvas & Maestro testing | Leaflet renders markers in the WebView DOM which are unreachable by black-box Maestro testing. |
