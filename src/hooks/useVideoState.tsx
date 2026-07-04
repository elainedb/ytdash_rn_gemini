import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NativeModules, Platform } from 'react-native';
import { Video, fetchVideosFromApi } from '../services/api';
import { saveVideosToCache, loadVideosFromCache } from '../services/cache';
import { isEmailWhitelisted } from '../utils/whitelist';
import { YOUTUBE_API_KEY, DEFAULT_MOCK_BASE_URL, PRODUCTION_BASE_URL } from '../config/secrets';
import TestConfigModule from '../../modules/test-config/src/TestConfigModule';
import { TestConfig } from '../../modules/test-config/src/TestConfig.types';

export type ScreenType = 'login' | 'home' | 'map';
export type SortOptionType = 'default' | 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc';

export interface VideoStateContextType {
  // Auth
  isLoggedIn: boolean;
  userEmail: string | null;
  authError: string | null;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  
  // Data
  videos: Video[];
  filteredVideos: Video[];
  loading: boolean;
  error: string | null;
  isOfflineMode: boolean;
  refreshVideos: () => Promise<void>;
  
  // Filtering & Sorting
  filterCategory: string | null;
  setFilterCategory: (category: string | null) => void;
  sortOption: SortOptionType;
  setSortOption: (option: SortOptionType) => void;
  
  // Navigation & UI
  currentScreen: ScreenType;
  setCurrentScreen: (screen: ScreenType) => void;
  selectedVideoIdForMapSheet: string | null;
  setSelectedVideoIdForMapSheet: (id: string | null) => void;
  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: (open: boolean) => void;
  isSortPanelOpen: boolean;
  setIsSortPanelOpen: (open: boolean) => void;
  
  // Launch Extras / Config
  testConfig: TestConfig | null;
  apiBaseUrl: string;
  apiKey: string;
  
  // External Links Mocking
  capturedUrl: string | null;
  setCapturedUrl: (url: string | null) => void;
  externalOpenError: string | null;
  setExternalOpenError: (err: string | null) => void;
}

const VideoStateContext = createContext<VideoStateContextType | undefined>(undefined);

export const VideoStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Test Config & Launch Extras State
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(PRODUCTION_BASE_URL);
  const [apiKey, setApiKey] = useState<string>(YOUTUBE_API_KEY);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data State
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Filter/Sort State
  const [filterCategory, setFilterCategoryState] = useState<string | null>(null);
  const [sortOption, setSortOptionState] = useState<SortOptionType>('default');

  // Navigation / UI State
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [selectedVideoIdForMapSheet, setSelectedVideoIdForMapSheet] = useState<string | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isSortPanelOpen, setIsSortPanelOpen] = useState(false);

  // Mocking/Deep-linking Checks
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [externalOpenError, setExternalOpenError] = useState<string | null>(null);

  // Load launch config once at app startup
  useEffect(() => {
    async function loadConfig() {
      try {
        if (Platform.OS === 'android') {
          console.log('[Init] Requesting TestConfig from local native module');
          const config = await TestConfigModule.getTestConfig();
          console.log('[Init] Native config received:', config);
          
          setTestConfig(config);
          
          if (config.uiTestMode) {
            setApiBaseUrl(config.apiBaseUrl || DEFAULT_MOCK_BASE_URL);
            setApiKey(config.apiKey || 'DUMMY_API_KEY');
          } else {
            setApiBaseUrl(PRODUCTION_BASE_URL);
            setApiKey(YOUTUBE_API_KEY);
          }
        }
      } catch (err) {
        console.error('[Init] Error loading test config from native module:', err);
        // Default fallbacks
        setApiBaseUrl(PRODUCTION_BASE_URL);
        setApiKey(YOUTUBE_API_KEY);
      }
    }
    loadConfig();
  }, []);

  const refreshVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`[API] Refreshing videos from ${apiBaseUrl} using key ${apiKey.substring(0, 5)}...`);
      const fetched = await fetchVideosFromApi(apiBaseUrl, apiKey);
      setVideos(fetched);
      setIsOfflineMode(false);
      await saveVideosToCache(fetched);
    } catch (err: any) {
      console.warn('[API] Fetch failed, loading from AsyncStorage cache instead:', err);
      // Attempt to load from cache
      const cached = await loadVideosFromCache();
      if (cached && cached.length > 0) {
        setVideos(cached);
        setIsOfflineMode(true);
        setError(null); // No blocking error view! Stale-fallback behavior (AC-CACHE-01)
      } else {
        setError(err.message || 'Failed to fetch videos and no offline cache available.');
      }
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, apiKey]);

  // Handle Login Validation
  const login = useCallback(async (email: string): Promise<boolean> => {
    setAuthError(null);
    const resolvedEmail = (testConfig?.uiTestMode && testConfig?.mockAuthEmail) 
      ? testConfig.mockAuthEmail 
      : email;

    console.log(`[Auth] Attempting login with resolved email: "${resolvedEmail}"`);

    const isAllowed = isEmailWhitelisted(resolvedEmail, testConfig?.authorizedEmails || null);
    
    if (isAllowed) {
      setIsLoggedIn(true);
      setUserEmail(resolvedEmail);
      setAuthError(null);
      setCurrentScreen('home');
      // Trigger background data load
      setTimeout(() => {
        refreshVideos();
      }, 0);
      return true;
    } else {
      setIsLoggedIn(false);
      setAuthError('Unauthorized email address');
      return false;
    }
  }, [testConfig, refreshVideos]);

  // Handle Logout
  const logout = useCallback(() => {
    console.log('[Auth] Logging out user');
    setIsLoggedIn(false);
    setUserEmail(null);
    setAuthError(null);
    setVideos([]);
    setFilterCategoryState(null);
    setSortOptionState('date_desc');
    setCurrentScreen('login');
    setSelectedVideoIdForMapSheet(null);
    setIsFilterPanelOpen(false);
    setIsSortPanelOpen(false);
    setCapturedUrl(null);
    setExternalOpenError(null);
  }, []);

  // Filter & Sort Logic applied reactively to the core videos array
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);

  useEffect(() => {
    let result = [...videos];

    // Apply Filter
    if (filterCategory) {
      result = result.filter(v => v.category === filterCategory);
    }

    // Apply Sort
    if (sortOption !== 'default') {
      result.sort((a, b) => {
        if (sortOption === 'date_desc') {
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        } else if (sortOption === 'date_asc') {
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        } else if (sortOption === 'title_asc') {
          return a.title.localeCompare(b.title);
        } else if (sortOption === 'title_desc') {
          return b.title.localeCompare(a.title);
        }
        return 0;
      });
    }

    setFilteredVideos(result);
  }, [videos, filterCategory, sortOption]);

  const setFilterCategory = useCallback((category: string | null) => {
    console.log(`[Filter] Setting category filter to: ${category || 'ALL'}`);
    setFilterCategoryState(category);
  }, []);

  const setSortOption = useCallback((option: SortOptionType) => {
    console.log(`[Sort] Setting sort option to: ${option}`);
    setSortOptionState(option);
  }, []);

  return (
    <VideoStateContext.Provider
      value={{
        isLoggedIn,
        userEmail,
        authError,
        login,
        logout,
        
        videos,
        filteredVideos,
        loading,
        error,
        isOfflineMode,
        refreshVideos,
        
        filterCategory,
        setFilterCategory,
        sortOption,
        setSortOption,
        
        currentScreen,
        setCurrentScreen,
        selectedVideoIdForMapSheet,
        setSelectedVideoIdForMapSheet,
        isFilterPanelOpen,
        setIsFilterPanelOpen,
        isSortPanelOpen,
        setIsSortPanelOpen,
        
        testConfig,
        apiBaseUrl,
        apiKey,
        
        capturedUrl,
        setCapturedUrl,
        externalOpenError,
        setExternalOpenError
      }}
    >
      {children}
    </VideoStateContext.Provider>
  );
};

export const useVideoState = () => {
  const context = useContext(VideoStateContext);
  if (!context) {
    throw new Error('useVideoState must be used within a VideoStateProvider');
  }
  return context;
};
