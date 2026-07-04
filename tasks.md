# Tasks: YouTube Dashboard ("ytdash")

**Input**: Design documents from `plan.md` and requirements from `spec/spec.md` + `spec/acceptance-criteria.md`.

## Phase 1: Setup (Shared Infrastructure)
- [ ] T001 Initialize React Native and Expo workspace dependencies (install `react-native-webview` and `@react-native-async-storage/async-storage`)
- [ ] T002 Scaffold local Expo module for reading intent extras (`TestConfig`) using `npx create-expo-module --local`

---

## Phase 2: Foundational (Blocking Prerequisites)
- [ ] T003 Implement native Android Kotlin code for local module `TestConfig` to read `appContext.currentActivity?.intent?.extras`
- [ ] T004 Implement TypeScript wrapper for `TestConfig` and ensure proper autolinking
- [ ] T005 Implement domain whitelist logic in `src/utils/whitelist.ts`
- [ ] T006 Implement API client with pagination & channel aggregation in `src/services/api.ts`
- [ ] T007 Implement caching and persistent storage using AsyncStorage in `src/services/cache.ts`
- [ ] T008 Implement reverse-geocoding service with local lookup of coordinate fixtures and Nominatim fallback in `src/services/geocode.ts`
- [ ] T009 Implement core unidirectional state machine & React Context in `src/hooks/useVideoState.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Authentication & Access Control (Priority: P1)
**Goal**: User sign-in with Google, whitelisting check, mockAuthEmail bypass in uiTestMode, error feedback, and logout.
**Verification**: `flows/AC-LOGIN-01.yaml`, `flows/AC-LOGIN-02.yaml`, `flows/AC-LOGIN-03.yaml`

- [ ] T010 Create `screen_login` component with standard login views and `login_google_button`
- [ ] T011 Connect login flows to Google Sign-In (real mode) and launch-args bypass `mockAuthEmail` (test mode)
- [ ] T012 Implement whitelist checks and render `login_error_message` on validation failures
- [ ] T013 Implement logout button `logout_button` to clear state and redirect to login

**Checkpoint**: Login story fully functional.

---

## Phase 4: User Story 2 - Video List & Channel Aggregation (Priority: P1)
**Goal**: Display aggregated videos from all channels listed in `channels.json`, follow pagination, show count, support refresh and external video launches.
**Verification**: `flows/AC-LIST-01.yaml`, `flows/AC-LIST-02.yaml`, `flows/AC-LIST-03.yaml`, `flows/AC-COUNT-01.yaml`, `flows/AC-LINK-01.yaml`

- [ ] T014 Create `video_list` ScrollView/FlatList rendering each video as a `video_list_item`
- [ ] T015 Render total video count in the title using `video_count` testID
- [ ] T016 Implement error retries with `error_view` and `error_retry_button`, loading state with `loading_indicator`
- [ ] T017 Implement pull-to-refresh with `refresh_control`
- [ ] T018 Implement deep-link open for YouTube videos and support `captureExternalLinks` test mode using `external_open_url` and `external_open_error` banners at App root

**Checkpoint**: Video list and deep-linking story fully functional.

---

## Phase 5: User Story 3 - Caching, Filtering & Sorting (Priority: P2)
**Goal**: Persistent caching with AsyncStorage, offline launching, filtering by category (channel label), sorting by date descending/ascending, utilizing regex-friendly UI labels.
**Verification**: `flows/AC-CACHE-01.yaml`, `flows/AC-FILTER-01.yaml`, `flows/AC-SORT-01.yaml`

- [ ] T019 Implement caching mechanisms on list load/refresh and automatic offline retrieval in `useVideoState`
- [ ] T020 Create filter UI sheet `FilterPanel` that replaces/occludes the list while open to avoid text collisions
- [ ] T021 Create sort UI sheet `SortPanel` with labels ending in the target regex terms (`Date — newest`, `Date — oldest`) that replaces/occludes the list while open
- [ ] T022 Integrate sort and filter operations in domain helper `src/utils/sortFilter.ts` and connect to UI state

**Checkpoint**: Sorting, filtering, and caching fully functional.

---

## Phase 6: User Story 4 - Map Screen (Priority: P3)
**Goal**: Show OpenStreetMap in a WebView, draw pins for located videos, support native horizontal marker scroll overlay `map_marker` for accessibility, bottom sheet with YouTube action buttons.
**Verification**: `flows/AC-MAP-01.yaml`, `flows/AC-MAP-02.yaml`, `flows/AC-MAP-03.yaml`

- [ ] T023 Integrate `screen_map` route/screen and navigate via `map_nav_button`
- [ ] T024 Implement Leaflet OpenStreetMap in WebView using `react-native-webview`
- [ ] T025 Build horizontal scrollable native row of `map_marker` chips below the map for Maestro access
- [ ] T026 Build custom absolute native overlay bottom sheet `detail_bottom_sheet` containing `detail_video_url` and `detail_open_youtube_button`
- [ ] T027 Wire coordinate geocoding (place names) via reverse geocoder and connect both WebView-pins and native chips to open the bottom sheet

**Checkpoint**: Interactive map screen fully functional.

---

## Phase 7: Polish & Self-Validation (Priority: P1)
**Goal**: Local Maestro verification, wire production secrets (real API key / google-services), static analysis checks, and signaling completion.

- [ ] T028 Run full set of Maestro AC tests locally and debug regressions
- [ ] T029 Wire real mode credentials and verify functionality
- [ ] T030 Ensure static analysis code cleanliness (TypeScript compile & eslint checks)
- [ ] T031 Write `BUILD-REPORT.md` documenting results and stacks
- [ ] T032 Signal complete state by writing `.build-complete` to the workspace root
