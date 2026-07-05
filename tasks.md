# Tasks: ytdash

## Phase 1: Setup
- [ ] T001 Initialize Native Module for reading intent extras (`TestConfig`).
- [ ] T002 Setup `expo-router` and basic navigation structure.
- [ ] T003 Install dependencies: zustand, async-storage, react-native-webview, expo-auth-session.

## Phase 2: Iteration 1 - Authentication & Access Control
- [ ] T004 Implement Google Sign-in flow and Email Whitelist validation.
- [ ] T005 Build Login Screen with `login_google_button`, `login_error_message`.
- [ ] T006 Implement Logout functionality in Home screen (`logout_button`).

## Phase 3: Iteration 2 - Video List
- [ ] T007 Implement YouTube API service (read base URL from `TestConfig`, fetch channels/videos, handle pagination).
- [ ] T008 Setup Zustand store to handle loading/error/content states.
- [ ] T009 Build Home Screen list (`video_list`, `video_list_item`, `video_count`, `refresh_control`).
- [ ] T010 Implement external linking to YouTube (respecting `captureExternalLinks`).

## Phase 4: Iteration 3 - Caching, Filtering, Sorting
- [ ] T011 Implement `AsyncStorage` caching (stale-fallback).
- [ ] T012 Implement Filter UI (`filter_button`, `filter_apply_button`) and logic.
- [ ] T013 Implement Sort UI (`sort_button`, `sort_apply_button`) and logic.

## Phase 5: Iteration 4 - Map
- [ ] T014 Add Map Screen navigation (`map_nav_button`, `screen_map`).
- [ ] T015 Implement Leaflet map in `react-native-webview` with OSM tiles.
- [ ] T016 Implement Native map markers overlay (`map_marker`).
- [ ] T017 Implement Bottom Sheet (`detail_bottom_sheet`, `detail_open_youtube_button`).

## Phase 6: Polish & Cross-Cutting Concerns
- [ ] T018 Verify all `testID`s match the Constitution.
- [ ] T019 Run tests against Maestro flows in `flows/`.
