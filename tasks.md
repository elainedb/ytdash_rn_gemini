# Tasks: ytdash

**Input**: Design documents from `spec/spec.md`

## Phase 1: Setup & Foundational

- [ ] T001 Initialize React Native app dependencies (expo-router, zustand, async-storage, react-native-webview).
- [ ] T002 Create Local Expo Module `test-config` to expose Android intent extras (uiTestMode, mockAuthEmail, apiBaseUrl, apiKey, authorizedEmails, captureExternalLinks) to JS.
- [ ] T003 Set up config loading logic in root layout (reading from `test-config` module).

## Phase 2: User Story 1 - Authentication & Access Control (AC-LOGIN-01, 02, 03)

- [ ] T004 Create Auth store in Zustand.
- [ ] T005 Implement `screen_login` with `login_google_button`.
- [ ] T006 Implement whitelist logic utilizing `authorizedEmails` from config. Show `login_error_message` for denied access.
- [ ] T007 Implement logout functionality (`logout_button`).

## Phase 3: User Story 2 - Video List & API (AC-LIST-01, 02, 03, AC-COUNT-01, AC-LINK-01)

- [ ] T008 Implement Video API client (fetch from `apiBaseUrl` or mock, follow pagination for all pages).
- [ ] T009 Aggregate videos from all channels in `config/channels.json`.
- [ ] T010 Implement `screen_home` and `video_list` with `video_list_item`.
- [ ] T011 Show total loaded video count (`video_count` in header).
- [ ] T012 Implement `refresh_control` and explicit loading/error states (`loading_indicator`, `error_view`, `error_retry_button`).
- [ ] T013 Implement external link opening (checking `captureExternalLinks` config: show `external_open_url` if true, launch via `Linking` and show `external_open_error` on failure if false).

## Phase 4: User Story 3 - Caching, Filtering, Sorting (AC-CACHE-01, AC-FILTER-01, AC-SORT-01)

- [ ] T014 Persist fetched videos to `AsyncStorage` (cache replace-on-refresh, stale fallback on error).
- [ ] T015 Implement filtering UI (panel replacing the list when open) with `filter_button` and `filter_apply_button`.
- [ ] T016 Implement sorting UI (panel replacing the list when open) with `sort_button` and `sort_apply_button`. Ensure correct text labels per spec.

## Phase 5: User Story 4 - Map & Native Affordance (AC-MAP-01, 02, 03)

- [ ] T017 Implement `map_nav_button` and `screen_map`.
- [ ] T018 Integrate `react-native-webview` with Leaflet to display OSM map and pins.
- [ ] T019 Implement native accessible marker affordance (horizontal list of `map_marker` chips).
- [ ] T020 Implement `detail_bottom_sheet` (native View overlay) with `detail_video_url` and `detail_open_youtube_button`. Ensure external opening logic is shared with the list.

## Phase 6: Validation & Polish

- [ ] T021 Self-validate with Maestro against the mock server.
- [ ] T022 Wire real Google Sign-In config using provided `google-services.json` / secrets.
- [ ] T023 Write `BUILD-REPORT.md`.
- [ ] T024 Create `.build-complete` to signal harness.
