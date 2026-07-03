# Tasks: YouTube Dashboard ("ytdash")

**Input**: Design documents from `spec/` and `plan.md`

## Phase 1: Setup & Dependencies

- [ ] T001 Install required npm packages (`react-native-webview`, `@react-native-async-storage/async-storage`, `@react-native-google-signin/google-signin`)
- [ ] T002 Verify TypeScript compiles correctly without errors
- [ ] T003 Initialize folder structures inside `src/`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T004 Build/expose Android Intent Extras reader Native Module for React Native
- [ ] T005 Create the `TestConfig` helper class to parse extras and environment configurations
- [ ] T006 Implement the basic App state hook/context (Auth and UI state)
- [ ] T007 Setup the YouTube API client supporting pagination and configured channels

---

## Phase 3: User Story 1 - Authentication & Access Control (Priority: P1)

- [ ] T008 [P] [US1] Create the modern, beautiful `LoginScreen` component with `login_google_button` and `login_error_message`
- [ ] T009 [US1] Implement Google Sign-In with email whitelist logic
- [ ] T010 [US1] Support mock sign-in bypass when `mockAuthEmail` is supplied in UI test mode
- [ ] T011 [US1] Implement `logout_button` and session clearance

---

## Phase 4: User Story 2 - Video List & Pagination (Priority: P1)

- [ ] T012 [P] [US2] Create `HomeScreen` containing the list layout and beautiful `VideoCard` component
- [ ] T013 [US2] Implement API aggregation across all configured channels and follow pagination page tokens
- [ ] T014 [US2] Display total loaded video count using `video_count` identifier
- [ ] T015 [US2] Implement pull-to-refresh (`refresh_control`) and retry logic on errors
- [ ] T016 [US2] Setup external YouTube video link opening with `captureExternalLinks` support

---

## Phase 5: User Story 3 - Caching, Filtering, and Sorting (Priority: P2)

- [ ] T017 [US3] Implement persistent caching of fetched videos in `AsyncStorage` (TLL/Fallback)
- [ ] T018 [US3] Implement UI panels for filtering by category/channel label
- [ ] T019 [US3] Implement UI panels for sorting by date and title (ensuring regex compliance)
- [ ] T020 [US3] Ensure filter/sort views overlay or replace the main list to prevent collisions with text selectors

---

## Phase 6: User Story 4 - Map & Bottom Sheet (Priority: P2)

- [ ] T021 [US4] Create `MapScreen` embedding OpenStreetMap via a Leaflet WebView
- [ ] T022 [US4] Expose reachable `map_marker` list/buttons for Maestro selection
- [ ] T023 [US4] Implement `detail_bottom_sheet` with video info and `detail_open_youtube_button`
- [ ] T024 [US4] Sync Leaflet WebView pin clicks via `postMessage` to open the native bottom sheet

---

## Phase 7: Polish, Verification & Completion (Priority: P3)

- [ ] T025 Run Maestro E2E test flows against the local mock server
- [ ] T026 Integrate real mode Google Sign-In and API keys
- [ ] T027 Generate `BUILD-REPORT.md`
- [ ] T028 Signal completion by writing `.build-complete` file
