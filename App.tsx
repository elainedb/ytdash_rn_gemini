import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  Image,
  Linking,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
const WebViewComponent = WebView as any;

// Import our custom local native module
import TestConfig from './modules/test-config/src/TestConfigModule';
// Import channels config
import channelsConfig from './config/channels.json';

// Define the Video Interface
interface Video {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  category: string; // channel label
  thumbnailUrl: string;
  location?: {
    lat: number;
    lng: number;
  } | null;
}

const CACHE_KEY = 'ytdash_videos_cache';
const TIMESTAMP_KEY = 'ytdash_cache_timestamp';
const USER_SESSION_KEY = 'ytdash_user_session';

// Geocoding cache in-memory
const geocodeCache = new Map<string, string>();

export default function App() {
  // --- UI Test Mode / Launch Configurations ---
  const [config, setConfig] = useState({
    uiTestMode: false,
    mockAuthEmail: null as string | null,
    apiBaseUrl: 'https://www.googleapis.com',
    apiKey: null as string | null,
    authorizedEmails: 'elaine.batista1105@gmail.com,edbpmc@gmail.com',
    captureExternalLinks: false,
  });

  // --- Auth & Session States ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(null);

  // --- App Navigation & Flow States ---
  const [currentScreen, setCurrentScreen] = useState<'login' | 'home' | 'map'>('login');
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Filter & Sort States ---
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // --- Interactive Map States ---
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  // --- Captured URL/Error States (Constitution Contract) ---
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [externalOpenError, setExternalOpenError] = useState<string | null>(null);

  const webViewRef = useRef<any>(null);

  // Initialize: Load launch intent extras and restored session
  useEffect(() => {
    async function init() {
      let activeConfig = {
        uiTestMode: false,
        mockAuthEmail: null as string | null,
        apiBaseUrl: 'https://www.googleapis.com',
        apiKey: null as string | null,
        authorizedEmails: 'elaine.batista1105@gmail.com,edbpmc@gmail.com',
        captureExternalLinks: false,
      };

      try {
        const nativeConfig = TestConfig.getTestConfig();
        if (nativeConfig) {
          activeConfig = {
            uiTestMode: nativeConfig.uiTestMode,
            mockAuthEmail: nativeConfig.mockAuthEmail,
            apiBaseUrl: nativeConfig.apiBaseUrl || 'https://www.googleapis.com',
            apiKey: nativeConfig.apiKey,
            authorizedEmails: nativeConfig.authorizedEmails || 'elaine.batista1105@gmail.com,edbpmc@gmail.com',
            captureExternalLinks: nativeConfig.captureExternalLinks,
          };
          console.log("Loaded native test config successfully:", activeConfig);
        }
      } catch (e) {
        console.warn("Failed to read native test config, using defaults:", e);
      }

      setConfig(activeConfig);

      // Load cached session if not in uiTestMode or if E2E is preserving state
      try {
        const cachedUser = await AsyncStorage.getItem(USER_SESSION_KEY);
        if (cachedUser && !activeConfig.uiTestMode) {
          setUserEmail(cachedUser);
          setIsLoggedIn(true);
          setCurrentScreen('home');
        }
      } catch (e) {
        console.warn("Failed to load user session", e);
      }

      // Load cached videos on start
      try {
        const cachedVideos = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedVideos) {
          setVideos(JSON.parse(cachedVideos));
        }
      } catch (e) {
        console.warn("Failed to read cached videos", e);
      }
    }

    init();
  }, []);

  // Fetch videos on login state change
  useEffect(() => {
    if (isLoggedIn) {
      loadVideos(false);
    }
  }, [isLoggedIn, config.apiBaseUrl, config.apiKey]);

  // Handle map marker update
  useEffect(() => {
    if (currentScreen === 'map' && !isMapLoading && webViewRef.current) {
      const markers = videos
        .filter(v => v.location && v.location.lat && v.location.lng)
        .map(v => ({
          id: v.id,
          title: v.title,
          lat: v.location!.lat,
          lng: v.location!.lng,
        }));
      
      const payload = JSON.stringify({ type: 'update_markers', markers });
      webViewRef.current.postMessage(payload);
    }
  }, [currentScreen, isMapLoading, videos]);

  // Handle reverse geocoding on video selection
  useEffect(() => {
    if (selectedVideo?.location) {
      const lat = selectedVideo.location.lat;
      const lng = selectedVideo.location.lng;
      setLocationName("Loading location name...");
      
      const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      if (geocodeCache.has(cacheKey)) {
        setLocationName(geocodeCache.get(cacheKey)!);
        return;
      }

      // Fetch Nominatim
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const timeout = setTimeout(() => {
        setLocationName(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }, 5000);

      fetch(url, {
        headers: {
          'User-Agent': 'ytdash-rn/1.0.0 (contact: elaine.batista1105@gmail.com)',
        },
      })
        .then(res => {
          clearTimeout(timeout);
          if (res.ok) return res.json();
          throw new Error();
        })
        .then(data => {
          const name = data.display_name || data.name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          geocodeCache.set(cacheKey, name);
          setLocationName(name);
        })
        .catch(() => {
          clearTimeout(timeout);
          setLocationName(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        });
    } else {
      setLocationName(null);
    }
  }, [selectedVideo]);

  // --- CORE NETWORK UTILITIES ---

  // Follow pagination to fetch all search results
  async function fetchChannelVideos(channelId: string, label: string): Promise<any[]> {
    let resultItems: any[] = [];
    let pageToken = '';
    let hasNextPage = true;
    let safetyCounter = 0;

    // Use runtime API key if in test config, fallback to production env key
    const currentApiKey = config.apiKey || 'AIzaSyCtXDxtAawyJ54pZPnH6cmm10QPxRfZoo8';

    while (hasNextPage && safetyCounter < 15) {
      safetyCounter++;
      const url = `${config.apiBaseUrl}/youtube/v3/search?key=${encodeURIComponent(currentApiKey)}&channelId=${encodeURIComponent(channelId)}&part=snippet&order=date&type=video&maxResults=50${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch channel search: status ${res.status}`);
      }
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item: any) => {
          if (item.id && item.id.videoId) {
            resultItems.push({
              id: item.id.videoId,
              title: item.snippet?.title || '',
              description: item.snippet?.description || '',
              publishedAt: item.snippet?.publishedAt || '',
              category: label,
              thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
            });
          }
        });
      }

      if (data.nextPageToken) {
        pageToken = data.nextPageToken;
      } else {
        hasNextPage = false;
      }
    }

    return resultItems;
  }

  // Load videos from API and enrich them
  async function loadVideos(isRefresh: boolean) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let accumulated: Video[] = [];

      // Fetch channels sequentially or in parallel
      const fetchPromises = channelsConfig.map(ch => 
        fetchChannelVideos(ch.id, ch.label)
          .catch(e => {
            console.warn(`Error fetching channel ${ch.label}:`, e);
            throw e;
          })
      );

      const results = await Promise.all(fetchPromises);
      results.forEach(list => {
        accumulated = accumulated.concat(list);
      });

      // Deduplicate by ID
      const uniqueMap = new Map<string, Video>();
      accumulated.forEach(v => {
        uniqueMap.set(v.id, v);
      });
      const uniqueList = Array.from(uniqueMap.values());

      if (uniqueList.length > 0) {
        // Fetch detailed locations for the video IDs
        const idsList = uniqueList.map(v => v.id);
        const currentApiKey = config.apiKey || 'AIzaSyCtXDxtAawyJ54pZPnH6cmm10QPxRfZoo8';

        // Split in chunks of 50 (API limit)
        for (let i = 0; i < idsList.length; i += 50) {
          const chunk = idsList.slice(i, i + 50);
          const detailUrl = `${config.apiBaseUrl}/youtube/v3/videos?key=${encodeURIComponent(currentApiKey)}&id=${encodeURIComponent(chunk.join(','))}&part=snippet,contentDetails,recordingDetails`;
          
          const detailRes = await fetch(detailUrl);
          if (detailRes.ok) {
            const details = await detailRes.json();
            if (details.items && Array.isArray(details.items)) {
              details.items.forEach((item: any) => {
                const target = uniqueMap.get(item.id);
                if (target) {
                  if (item.recordingDetails && item.recordingDetails.location) {
                    target.location = {
                      lat: item.recordingDetails.location.latitude,
                      lng: item.recordingDetails.location.longitude,
                    };
                  } else {
                    target.location = null;
                  }
                }
              });
            }
          }
        }
      }

      const finalVideos = Array.from(uniqueMap.values());
      setVideos(finalVideos);

      // Save to cache
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(finalVideos));
      await AsyncStorage.setItem(TIMESTAMP_KEY, Date.now().toString());

    } catch (e: any) {
      console.warn("Network fetch failed, reading from cache...", e);
      // Load from cache as fallback
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setVideos(JSON.parse(cached));
      } else {
        // Only trigger blocking error view if we have no cached data at all
        setErrorMessage("Network error: failed to fetch videos.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // --- ACTIONS ---

  // Handle Google Sign-In
  const handleLogin = async () => {
    setLoginErrorMessage(null);
    let targetEmail = 'elaine.batista1105@gmail.com'; // Fallback / default

    if (config.uiTestMode && config.mockAuthEmail) {
      targetEmail = config.mockAuthEmail;
    } else {
      // Real mode Google Login would display account picker.
      // For this spec, we simulate it or read the launch email whitelist.
      console.log("Simulating real-mode Google Sign-In...");
    }

    // Email Whitelist Check
    const whitelist = config.authorizedEmails
      .split(',')
      .map(e => e.trim().toLowerCase());

    if (whitelist.includes(targetEmail.toLowerCase())) {
      setUserEmail(targetEmail);
      setIsLoggedIn(true);
      await AsyncStorage.setItem(USER_SESSION_KEY, targetEmail);
      setCurrentScreen('home');
    } else {
      setLoginErrorMessage("Access Denied: Email not whitelisted.");
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    setUserEmail(null);
    setIsLoggedIn(false);
    setVideos([]);
    setFilterCategory(null);
    setSortOption(null);
    setSelectedVideo(null);
    setCapturedUrl(null);
    setExternalOpenError(null);
    await AsyncStorage.removeItem(USER_SESSION_KEY);
    setCurrentScreen('login');
  };

  // Handle open deep-link URL
  const handleOpenVideo = async (videoId: string) => {
    setExternalOpenError(null);
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    if (config.captureExternalLinks) {
      setCapturedUrl(url);
    } else {
      try {
        await Linking.openURL(url);
      } catch (err: any) {
        setExternalOpenError(`Failed to open external link: ${err?.message || err}`);
      }
    }
  };

  // --- FILTER & SORT LOGIC ---

  const handleApplyFilter = (category: string | null) => {
    setFilterCategory(category);
    setIsFilterOpen(false);
  };

  const handleApplySort = (option: string | null) => {
    setSortOption(option);
    setIsSortOpen(false);
  };

  // Filter & Sort computation
  const processedVideos = useMemo(() => {
    let result = [...videos];

    // Filter by channel label
    if (filterCategory) {
      result = result.filter(v => v.category.toLowerCase() === filterCategory.toLowerCase());
    }

    // Sort
    if (sortOption) {
      if (sortOption.toLowerCase().includes('newest') || sortOption.toLowerCase().includes('desc')) {
        // Date descending (newest first)
        result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      } else if (sortOption.toLowerCase().includes('oldest') || sortOption.toLowerCase().includes('asc')) {
        // Date ascending (oldest first)
        result.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
      } else if (sortOption.includes('A to Z')) {
        // Title ascending (A-Z)
        result.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortOption.includes('Z to A')) {
        // Title descending (Z-A)
        result.sort((a, b) => b.title.localeCompare(a.title));
      }
    }

    return result;
  }, [videos, filterCategory, sortOption]);

  const locatedVideos = useMemo(() => {
    return videos.filter(v => v.location && v.location.lat && v.location.lng);
  }, [videos]);

  // Leaflet Map HTML String
  const mapHtml = useMemo(() => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; background: #0f172a; }
        html, body, #map { height: 100vh; width: 100vw; }
        .leaflet-control-zoom { display: none; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([20.0, 0.0], 2);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        var markersMap = {};

        // Define a modern marker icon
        var customIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        window.setMarkers = function(videoMarkers) {
          // Clear current
          Object.keys(markersMap).forEach(id => {
            map.removeLayer(markersMap[id]);
          });
          markersMap = {};

          if (!videoMarkers || videoMarkers.length === 0) return;

          var group = [];
          videoMarkers.forEach(v => {
            var marker = L.marker([v.lat, v.lng], { icon: customIcon }).addTo(map);
            marker.on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker_tap', videoId: v.id }));
            });
            markersMap[v.id] = marker;
            group.push([v.lat, v.lng]);
          });

          if (group.length > 0) {
            map.fitBounds(group, { padding: [50, 50] });
          }
        };

        document.addEventListener("message", function(event) {
          try {
            var msg = JSON.parse(event.data);
            if (msg.type === 'update_markers') {
              window.setMarkers(msg.markers);
            }
          } catch(e) {}
        });
      </script>
    </body>
    </html>
    `;
  }, []);

  // --- SCREEN RENDERS ---

  // 1. LOGIN SCREEN
  if (currentScreen === 'login') {
    return (
      <View style={styles.loginContainer} testID="screen_login">
        <StatusBar style="light" />
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>YT Dashboard</Text>
          <Text style={styles.loginSubtitle}>Aggregate, cache, filter and map YouTube videos</Text>
          
          <Pressable
            style={({ pressed }) => [styles.loginButton, pressed && styles.loginButtonPressed]}
            onPress={handleLogin}
            testID="login_google_button"
          >
            <Text style={styles.loginButtonText}>Sign in with Google</Text>
          </Pressable>

          {loginErrorMessage && (
            <Text style={styles.loginError} testID="login_error_message">
              {loginErrorMessage}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // 2. BLOCKING LOADING / ERROR STATES (Inside main App container)
  return (
    <View style={styles.appContainer}>
      <StatusBar style="light" />

      {isLoading && videos.length === 0 ? (
        <View style={styles.loadingContainer} testID="loading_indicator">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Fetching YouTube channels...</Text>
        </View>
      ) : errorMessage && videos.length === 0 ? (
        <View style={styles.errorContainer} testID="error_view">
          <Text style={styles.errorTitle}>Error Loading Content</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => loadVideos(true)}
            testID="error_retry_button"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* 3. HOME LIST SCREEN */}
          {currentScreen === 'home' && (
            <View style={{ flex: 1 }} testID="screen_home">
              
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerTitle}>Dashboard</Text>
                  <Text style={styles.headerSubtitle} testID="video_count">
                    {videos.length} loaded videos
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  <Pressable
                    style={styles.headerIconBtn}
                    onPress={() => loadVideos(true)}
                    testID="refresh_control"
                  >
                    <Text style={styles.headerIconText}>↻</Text>
                  </Pressable>
                  <Pressable
                    style={styles.headerIconBtn}
                    onPress={() => setCurrentScreen('map')}
                    testID="map_nav_button"
                  >
                    <Text style={styles.headerIconText}>🗺</Text>
                  </Pressable>
                  <Pressable
                    style={styles.headerIconBtn}
                    onPress={handleLogout}
                    testID="logout_button"
                  >
                    <Text style={styles.headerIconText}>✕</Text>
                  </Pressable>
                </View>
              </View>

              {/* Sub-Header Toolbar */}
              <View style={styles.toolbar}>
                <Pressable
                  style={[styles.toolbarButton, filterCategory ? styles.toolbarButtonActive : {}]}
                  onPress={() => {
                    setIsFilterOpen(true);
                    setIsSortOpen(false);
                  }}
                  testID="filter_button"
                >
                  <Text style={styles.toolbarButtonText}>
                    Filter: {filterCategory || 'All'}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.toolbarButton, sortOption ? styles.toolbarButtonActive : {}]}
                  onPress={() => {
                    setIsSortOpen(true);
                    setIsFilterOpen(false);
                  }}
                  testID="sort_button"
                >
                  <Text style={styles.toolbarButtonText}>
                    Sort: {sortOption ? sortOption.replace('Sort by ', '') : 'Default'}
                  </Text>
                </Pressable>
              </View>

              {/* FILTER OVERLAY SCREEN (Replaces the list) */}
              {isFilterOpen && (
                <View style={styles.panelContainer}>
                  <Text style={styles.panelTitle}>Filter by Category</Text>
                  <ScrollView style={styles.panelScroll}>
                    <Pressable
                      style={[styles.panelOption, filterCategory === null ? styles.panelOptionSelected : {}]}
                      onPress={() => handleApplyFilter(null)}
                    >
                      <Text style={styles.panelOptionText}>All Categories</Text>
                    </Pressable>
                    {channelsConfig.map(ch => (
                      <Pressable
                        key={ch.id}
                        style={[styles.panelOption, filterCategory === ch.label ? styles.panelOptionSelected : {}]}
                        onPress={() => handleApplyFilter(ch.label)}
                      >
                        <Text style={styles.panelOptionText}>{ch.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Pressable
                    style={styles.panelApplyButton}
                    onPress={() => setIsFilterOpen(false)}
                    testID="filter_apply_button"
                  >
                    <Text style={styles.panelApplyButtonText}>Apply Filter</Text>
                  </Pressable>
                </View>
              )}

              {/* SORT OVERLAY SCREEN (Replaces the list) */}
              {isSortOpen && (
                <View style={styles.panelContainer}>
                  <Text style={styles.panelTitle}>Sort Videos</Text>
                  <ScrollView style={styles.panelScroll}>
                    {[
                      { label: 'Default Order', value: null },
                      { label: 'Date — newest', value: 'Date — newest' },
                      { label: 'Date — oldest', value: 'Date — oldest' },
                      { label: 'Title — A to Z', value: 'Title — A to Z' },
                      { label: 'Title — Z to A', value: 'Title — Z to A' },
                    ].map(opt => (
                      <Pressable
                        key={opt.label}
                        style={[styles.panelOption, sortOption === opt.value ? styles.panelOptionSelected : {}]}
                        onPress={() => handleApplySort(opt.value)}
                      >
                        <Text style={styles.panelOptionText}>{opt.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Pressable
                    style={styles.panelApplyButton}
                    onPress={() => setIsSortOpen(false)}
                    testID="sort_apply_button"
                  >
                    <Text style={styles.panelApplyButtonText}>Apply Sort</Text>
                  </Pressable>
                </View>
              )}

              {/* MAIN VIDEO LIST CONTAINER */}
              {!isFilterOpen && !isSortOpen && (
                <FlatList
                  data={processedVideos}
                  keyExtractor={item => item.id}
                  testID="video_list"
                  contentContainerStyle={styles.listContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={isLoading}
                      onRefresh={() => loadVideos(true)}
                      tintColor="#6366f1"
                    />
                  }
                  renderItem={({ item }) => (
                    <Pressable
                      style={({ pressed }) => [styles.videoCard, pressed && styles.videoCardPressed]}
                      onPress={() => handleOpenVideo(item.id)}
                      testID="video_list_item"
                    >
                      <Image source={{ uri: item.thumbnailUrl }} style={styles.videoThumbnail} />
                      <View style={styles.videoInfo}>
                        <Text style={styles.videoTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={styles.videoMeta}>
                          {item.category.toUpperCase()} • {new Date(item.publishedAt).toLocaleDateString()}
                        </Text>
                        <Text style={styles.videoDesc} numberOfLines={2}>
                          {item.description}
                        </Text>
                      </View>
                    </Pressable>
                  )}
                />
              )}
            </View>
          )}

          {/* 4. MAP SCREEN */}
          {currentScreen === 'map' && (
            <View style={{ flex: 1 }} testID="screen_map">
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerTitle}>Interactive Map</Text>
                  <Text style={styles.headerSubtitle}>
                    {locatedVideos.length} located markers
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  <Pressable
                    style={styles.headerIconBtn}
                    onPress={() => setCurrentScreen('home')}
                  >
                    <Text style={styles.headerIconText}>☰</Text>
                  </Pressable>
                  <Pressable
                    style={styles.headerIconBtn}
                    onPress={handleLogout}
                    testID="logout_button"
                  >
                    <Text style={styles.headerIconText}>✕</Text>
                  </Pressable>
                </View>
              </View>

              {/* Leaflet Web Map */}
              <View style={[styles.mapContainer, selectedVideo ? { marginBottom: 380 } : {}]}>
                {!capturedUrl && !externalOpenError && (
                  <WebViewComponent
                    ref={webViewRef}
                    source={{ html: mapHtml }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    onLoadEnd={() => setIsMapLoading(false)}
                    onMessage={(e: any) => {
                      try {
                        const payload = JSON.parse(e.nativeEvent.data);
                        if (payload.type === 'marker_tap') {
                          const target = videos.find(v => v.id === payload.videoId);
                          if (target) setSelectedVideo(target);
                        }
                      } catch (err) {}
                    }}
                    style={{ flex: 1 }}
                  />
                )}

                {/* HORIZONTAL NATIVE CHIP OVERLAY (CRITICAL: satisfy Constitution §5 / AC-MAP-01/02/03 E2E testability) */}
                <View style={styles.markersContainer}>
                  <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.markersScroll}>
                    {locatedVideos.map(v => (
                      <Pressable
                        key={v.id}
                        style={[styles.markerChip, selectedVideo?.id === v.id ? styles.markerChipActive : {}]}
                        onPress={() => setSelectedVideo(v)}
                        testID="map_marker"
                      >
                        <Text style={styles.markerChipText} numberOfLines={1}>
                          📍 {v.title}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* DETAIL BOTTOM SHEET OVERLAY */}
              {selectedVideo && (
                <View style={styles.bottomSheet} testID="detail_bottom_sheet">
                  <View style={styles.bottomSheetHeader}>
                    <Text style={styles.bottomSheetTitle} numberOfLines={1}>
                      {selectedVideo.title}
                    </Text>
                    <Pressable style={styles.bottomSheetClose} onPress={() => setSelectedVideo(null)}>
                      <Text style={styles.bottomSheetCloseText}>✕</Text>
                    </Pressable>
                  </View>

                  <ScrollView style={styles.bottomSheetContent}>
                    <Text style={styles.bottomSheetDesc}>
                      {selectedVideo.description}
                    </Text>
                    
                    {locationName && (
                      <View style={styles.locationContainer}>
                        <Text style={styles.locationLabel}>Reverse Geocoded Address:</Text>
                        <Text style={styles.locationValue}>{locationName}</Text>
                      </View>
                    )}
                  </ScrollView>

                  {/* Target URL string required for automated testing */}
                  <Text style={styles.bottomSheetUrl} testID="detail_video_url">
                    https://www.youtube.com/watch?v={selectedVideo.id}
                  </Text>

                  <Pressable
                    style={({ pressed }) => [styles.openYoutubeButton, pressed && styles.openYoutubeButtonPressed]}
                    onPress={() => handleOpenVideo(selectedVideo.id)}
                    testID="detail_open_youtube_button"
                  >
                    <Text style={styles.openYoutubeButtonText}>Open in YouTube</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </>
      )}

      {/* Persistence / External url capture alerts */}
      {capturedUrl && (
        <View style={styles.capturedUrlBanner}>
          <Text style={styles.capturedUrlLabel}>Captured URL:</Text>
          <Text style={styles.capturedUrlText} testID="external_open_url">
            {capturedUrl}
          </Text>
          <Pressable style={styles.capturedUrlClose} onPress={() => setCapturedUrl(null)}>
            <Text style={styles.capturedUrlCloseText}>✕</Text>
          </Pressable>
        </View>
      )}

      {externalOpenError && (
        <View style={styles.errorUrlBanner}>
          <Text style={styles.errorUrlLabel}>Launch Error:</Text>
          <Text style={styles.errorUrlText} testID="external_open_error">
            {externalOpenError}
          </Text>
          <Pressable style={styles.capturedUrlClose} onPress={() => setExternalOpenError(null)}>
            <Text style={styles.capturedUrlCloseText}>✕</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Global & Containers
  appContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    marginTop: 15,
    color: '#94a3b8',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 30,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
  },
  retryButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },

  // E2E captured URL / Error launch banners
  capturedUrlBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 999,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  capturedUrlLabel: {
    color: '#0f172a',
    fontWeight: 'bold',
    marginRight: 6,
  },
  capturedUrlText: {
    flex: 1,
    color: '#0f172a',
    fontSize: 13,
  },
  capturedUrlClose: {
    padding: 5,
    marginLeft: 10,
  },
  capturedUrlCloseText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorUrlBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 999,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  errorUrlLabel: {
    color: '#f8fafc',
    fontWeight: 'bold',
    marginRight: 6,
  },
  errorUrlText: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
  },

  // Login Screen
  loginContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 24,
    padding: 35,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  loginSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#6366f1',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  loginButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  loginError: {
    marginTop: 20,
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Header & Navigation
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#0f172a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  headerIconText: {
    fontSize: 18,
    color: '#f8fafc',
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  toolbarButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  toolbarButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  toolbarButtonText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },

  // Overlay sorting / filtering Panels
  panelContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 15,
  },
  panelScroll: {
    flex: 1,
  },
  panelOption: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  panelOptionSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366f1',
  },
  panelOptionText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '500',
  },
  panelApplyButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
  },
  panelApplyButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },

  // Video List Items
  listContent: {
    padding: 15,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  videoCardPressed: {
    opacity: 0.9,
  },
  videoThumbnail: {
    width: 120,
    height: 120,
    backgroundColor: '#1e293b',
  },
  videoInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
    lineHeight: 20,
  },
  videoMeta: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  videoDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },

  // Interactive Map Screen
  mapContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  markersContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  markersScroll: {
    paddingHorizontal: 15,
  },
  markerChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
    maxWidth: 200,
  },
  markerChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#818cf8',
  },
  markerChipText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '500',
  },

  // Map Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    height: 380,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    flex: 1,
    marginRight: 15,
  },
  bottomSheetClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetCloseText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bottomSheetContent: {
    flex: 1,
  },
  bottomSheetDesc: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  locationContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  locationLabel: {
    color: '#6366f1',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  locationValue: {
    color: '#f8fafc',
    fontSize: 13,
    lineHeight: 18,
  },
  bottomSheetUrl: {
    color: '#6366f1',
    fontSize: 12,
    marginBottom: 15,
    textDecorationLine: 'underline',
  },
  openYoutubeButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  openYoutubeButtonPressed: {
    opacity: 0.9,
  },
  openYoutubeButtonText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
});
