# Implementation Plan: ytdash

**Date**: 2026-07-05 | **Spec**: spec.md

## Summary

Build a React Native (Expo) dashboard for YouTube videos that authenticates via Google, fetches videos from multiple channels, caches them locally, allows filtering/sorting, and displays located videos on a map.

## Technical Context

**Language/Version**: TypeScript / React Native 0.86 / Expo SDK 57
**Primary Dependencies**: `expo-router` (navigation), `zustand` (state), `@react-native-async-storage/async-storage` (caching), `@react-native-google-signin/google-signin` (auth), `react-native-webview` (map)
**Storage**: Async Storage
**Testing**: Maestro flows (E2E)
**Target Platform**: Android (primary for tests)
**Project Type**: Mobile App
**Constraints**: Must run locally with mock server, must support UI Test Mode

## Project Structure

```text
src/
├── app/          # Expo router screens
├── components/   # UI components
├── config/       # Environment config, test-mode config
├── store/        # Zustand stores
├── utils/        # Helpers
└── modules/      # Local Expo modules (TestConfig)
```

## Decisions
- State management: `zustand` for simplicity and unidirectional flow.
- Navigation: `expo-router` (file-based).
- Map: `react-native-webview` with Leaflet DOM map, plus native marker overlay to satisfy Maestro testing requirements.
- UI Test Mode: Local Expo module to read Android intent extras.
