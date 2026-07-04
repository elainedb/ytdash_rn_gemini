# Implementation Plan: ytdash

**Branch**: `main` | **Date**: 2026-07-04 | **Spec**: spec.md

**Input**: Feature specification from `spec/spec.md`

## Summary

Build a production-quality Android app using React Native (Expo) that displays a list of YouTube videos from specific channels, allows caching/filtering/sorting, and displays markers on a map for videos with location data. The app must feature a UI-test-mode driven by intent extras to be verified by an automated Maestro harness.

## Technical Context

**Language/Version**: TypeScript, React Native 0.74+, Expo SDK 51+

**Primary Dependencies**: 
- `expo-router` (navigation)
- `zustand` (state management)
- `@react-native-async-storage/async-storage` (caching)
- `react-native-webview` + `leaflet` (maps)

**Storage**: AsyncStorage (JSON representation of the video list, 24h TTL, stale-fallback).

**Testing**: E2E testing driven via Maestro flows (already provided).

**Target Platform**: Android (primary for E2E harness).

**Project Type**: Mobile app

**Performance Goals**: Smooth scrolling, non-blocking UI during network/disk access.

**Constraints**: Must strictly adhere to the Selector contract and UI-test-mode contract for Maestro compatibility. Map markers require a native affordance because Leaflet DOM nodes are unreachable by Maestro.

**Scale/Scope**: 4 source channels, small dataset (tens of videos).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Layered separation: Yes, separate API client, zustand store, and UI components.
- Unidirectional state: Yes, Zustand provides explicit state (loading/content/error).
- No blocking work on UI thread: Yes, async `fetch` and AsyncStorage.
- Single source of truth: Yes, store state is populated from cache and updated via network.
- Explicit error handling: Yes, Error views for network/auth/map with retry buttons.
- Selectors and test mode: Yes, `testID` implemented for all required elements, and a custom local Expo module to read launch intent extras.
- Map native affordance: Yes, a row of native chips below the map for selection.

## Project Structure

### Documentation (this feature)

```text
plan.md
tasks.md
BUILD-REPORT.md
```

### Source Code (repository root)

```text
app/                 # expo-router pages
  _layout.tsx
  index.tsx          # login screen
  home.tsx           # video list screen
  map.tsx            # map screen
components/          # UI components
modules/             # Local Expo native modules
  test-config/
store/               # Zustand state
api/                 # YouTube API and geocoding
```

**Structure Decision**: React Native app using `expo-router` and a local Expo module for reading intent extras.
