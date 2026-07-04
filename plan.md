# Implementation Plan: YouTube Dashboard ("ytdash")

**Branch**: `main` | **Date**: 2026-07-04 | **Spec**: [spec/spec.md](file:///tmp/ytrun.g7HbUC/workspace/spec/spec.md)

## Summary
The goal of this project is to build a production-quality Android app using React Native and Expo that aggregates videos from YouTube channels configured in `channels.json`, whitelists access based on Google Sign-In or test email credentials, implements offline-first data caching with `AsyncStorage`, and displays geotagged videos on an interactive Leaflet-in-WebView map with a native marker-overlay affordance for automation compatibility.

## Technical Context

- **Language/Version**: TypeScript / ES2022 / Node.js
- **Primary Dependencies**: React Native 0.86, Expo 57, React 19, `react-native-webview` (for Leaflet maps), `@react-native-async-storage/async-storage` (for persistent caching)
- **Storage**: JSON-serialized `@react-native-async-storage/async-storage` for offline cache
- **Testing**: Jest for domain unit testing (auth whitelist, sorting/filtering helpers), Maestro for end-to-end integration flows
- **Target Platform**: Android (minSdk 29, targeting Emulator/Device `25251FDF60029V`)
- **Project Type**: React Native / Expo Single Project App
- **Performance Goals**: Instant offline list render, fast transition to map (<150ms), debounce/cache Nominatim geocoding
- **Constraints**: 100% compliant with Spec Constitution (no hardcoded credentials, configurable endpoints at runtime, stable `testID` accessibility tags, and cleartext mock-server compatibility)

## Constitution Check

All requirements from the `spec/constitution.md` have been reviewed and mapped into the architecture:
- **Layered Separation**: Separating net fetches (`src/services/api.ts`), persistence (`src/services/cache.ts`), and view logic (`src/hooks/useVideoState.ts`).
- **Dependency Inversion**: UI depends on `useVideoState` and custom context, allowing mocked or real implementations based on `uiTestMode`.
- **Unidirectional State**: Explicit UI states (`loading`, `content`, `empty`, `error`) rendered from predictable immutable structures.
- **No Blocking main thread**: Async/await for all AsyncStorage, network, and reverse-geocoding calls.
- **Single Source of Truth**: The local store is read by the UI; network refreshes write to local store.
- **Stable testIDs**: Mandated `testID` tags attached exactly as required by §3 of the constitution.
- **Test Mode Launch Extras**: Extracted via a native local Expo module `TestConfig` which reads launch-intent extras from the native host activity.
- **Map Accessible Markers**: Rendered as interactive native chips (`map_marker`) overlaying the Leaflet-in-WebView map to remain 100% accessible to the Maestro automated harness.

## Project Structure

The project will follow a clean, structured layout:

```text
/
├── App.tsx                     # Main React Native Application Root
├── app.json                    # Expo config with com.example.ytdash_rn & usesCleartextTraffic
├── package.json                # Dependencies & script configurations
├── tsconfig.json               # TypeScript configuration
├── modules/
│   └── test-config/            # Local Expo module for reading intent extras (native Kotlin)
│       ├── android/            # Native Kotlin implementation
│       ├── src/                # JS/TS interface bindings
│       └── expo-module.config.json
├── src/
│   ├── components/
│   │   ├── FilterPanel.tsx     # Overlay filter UI panel (replaces list on open)
│   │   ├── SortPanel.tsx       # Overlay sort UI panel (replaces list on open)
│   │   ├── DetailSheet.tsx     # Custom native absolute-positioned detail sheet
│   │   ├── MapView.tsx         # Leaflet OpenStreetMap in WebView
│   │   ├── VideoItem.tsx       # Video list row item
│   │   └── ExternalOpenBanner.tsx # Capture-external-links banner at App root
│   ├── services/
│   │   ├── api.ts              # API service for search.list and videos.list
│   │   ├── cache.ts            # AsyncStorage persistence wrapper
│   │   └── geocode.ts          # Reverse geocoding (Nominatim + local lookup)
│   ├── hooks/
│   │   └── useVideoState.ts    # React Context and custom hook for core state
│   └── utils/
│       ├── whitelist.ts        # Whitelist checking and email auth rules
│       ├── sortFilter.ts       # Domain logic for client-side sort & filter
│       └── testHelpers.ts      # Test config utilities
```

## Strategy & Core Decisions

### 1. Launch Intent Extras (The `TestConfig` Local Module)
Since React Native does not natively expose Android intent extras (only deep links), we will scaffold a local Expo module `TestConfig` using `npx create-expo-module --local`. It will implement a Kotlin function `getTestConfig` that accesses the `appContext.currentActivity?.intent?.extras` and returns a dictionary to JS:
- `uiTestMode`: Boolean
- `mockAuthEmail`: String
- `apiBaseUrl`: String
- `apiKey`: String
- `authorizedEmails`: String
- `captureExternalLinks`: Boolean

### 2. Map & Accessibility Affordance
We will use `react-native-webview` to render an interactive Leaflet OpenStreetMap. For human users, the WebView's HTML will draw 5 markers using Leaflet's standard Marker API and use `window.ReactNativeWebView.postMessage` to signal marker taps back to the native app to open the bottom sheet.
For the Maestro harness (which cannot read elements inside a WebView DOM), we will display a horizontal scrollable row of native `Pressable` chips at the bottom of the screen (or overlaying the map), each with `testID="map_marker"`. Tapping a native chip will trigger the exact same selection logic, opening the native overlay `detail_bottom_sheet`.

### 3. State Management & Cache-Fallback
We will build a simple, clean, and robust state machine using a custom React Context. This is highly idiomatic, lightweight, and ensures synchronous updates with zero external boilerplate.
The cache strategy uses `@react-native-async-storage/async-storage`. If a network fetch fails, we fall back to the cached list of videos (AC-CACHE-01) with a passive warning, ensuring the screen is never blocked by an `error_view` if cached data is available.

### 4. Avoiding Text Collisions during Sort/Filter
To avoid text collisions (e.g., Maestro picking a video title like "Tech Talk One" instead of the "Tech" category option), opening the Sort or Filter panel will temporarily replace/occlude the main video list. This guarantees 100% deterministic automation selectors.
Furthermore, sort option labels will explicitly end with the expected regex keyword (e.g., "Date — newest" or "Date — oldest") to match the Maestro assertion flow.
