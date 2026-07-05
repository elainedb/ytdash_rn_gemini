# Tasks: ytdash

## Phase 1: Setup
- [ ] T001 Initialize Expo project dependencies (expo-router, zustand, async-storage, google-signin, webview)
- [ ] T002 Create TestConfig Expo module to read UI test mode extras.
- [ ] T003 Set up config constants, extracting keys and URL overrides.

## Phase 2: Auth (Iteration 1)
- [ ] T004 Build Google Sign-in integration with UI test mode bypass (`mockAuthEmail`).
- [ ] T005 Implement login screen (`screen_login`, `login_google_button`, `login_error_message`).
- [ ] T006 Implement auth state management and whitelist validation.
- [ ] T007 Add logout functionality (`logout_button`).

## Phase 3: Video List (Iteration 2)
- [ ] T008 Implement YouTube API client (fetch videos from channels with pagination).
- [ ] T009 Build home screen layout with list (`screen_home`, `video_list`, `video_list_item`).
- [ ] T010 Display video count in header (`video_count`).
- [ ] T011 Handle external link opening, capturing URL in test mode (`external_open_url`, `external_open_error`).
- [ ] T012 Handle loading and error states (`loading_indicator`, `error_view`, `error_retry_button`).
- [ ] T013 Implement pull to refresh (`refresh_control`).

## Phase 4: Cache, Filter, Sort (Iteration 3)
- [ ] T014 Implement AsyncStorage for offline cache.
- [ ] T015 Build filter UI (`filter_button`, `filter_apply_button`).
- [ ] T016 Build sort UI (`sort_button`, `sort_apply_button`).
- [ ] T017 Integrate filter and sort logic into Zustand store.

## Phase 5: Map (Iteration 4)
- [ ] T018 Set up map screen (`screen_map`, `map_nav_button`).
- [ ] T019 Implement WebView Leaflet map and native marker overlay (`map_marker`).
- [ ] T020 Build bottom sheet for marker details (`detail_bottom_sheet`, `detail_video_url`, `detail_open_youtube_button`).

## Phase 6: Validation
- [ ] T021 Run all Maestro flows on Android emulator.
- [ ] T022 Generate `BUILD-REPORT.md` and touch `.build-complete`.
