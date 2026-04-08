import { create } from 'zustand';
import { Video } from '../../domain/entities/video';
import { GetVideos } from '../../domain/usecases/get-videos';
import { GetVideosByChannel } from '../../domain/usecases/get-videos-by-channel';
import { GetVideosByCountry } from '../../domain/usecases/get-videos-by-country';

export type VideosStatus = 'initial' | 'loading' | 'loaded' | 'error';

export interface SortOptions {
  sortBy: 'publishedDate' | 'recordingDate';
  sortOrder: 'ascending' | 'descending';
}

export interface FilterOptions {
  channelName: string | null;
  country: string | null;
}

export interface VideosState {
  status: VideosStatus;
  allVideos: Video[];
  filteredVideos: Video[];
  filters: FilterOptions;
  sortOptions: SortOptions;
  isRefreshing: boolean;
  errorMessage: string | null;
  
  availableChannels: string[];
  availableCountries: string[];

  // Actions
  loadVideos: (getVideosUseCase: GetVideos) => Promise<void>;
  refreshVideos: (getVideosUseCase: GetVideos) => Promise<void>;
  filterByChannel: (channelName: string | null) => void;
  filterByCountry: (country: string | null) => void;
  sortVideos: (sortBy: SortOptions['sortBy'], sortOrder: SortOptions['sortOrder']) => void;
  clearFilters: () => void;
}

const CHANNEL_IDS = [
  'UCynoa1DjwnvHAowA_jiMEAQ',
  'UCK0KOjX3beyB9nzonls0cuw',
  'UCACkIrvrGAQ7kuc0hMVwvmA',
  'UCtWRAKKvOEA0CXOue9BG8ZA',
];

const defaultFilters: FilterOptions = {
  channelName: null,
  country: null,
};

const defaultSortOptions: SortOptions = {
  sortBy: 'publishedDate',
  sortOrder: 'descending',
};

const applyFiltersAndSort = (
  videos: Video[],
  filters: FilterOptions,
  sortOptions: SortOptions
): Video[] => {
  let result = [...videos];

  if (filters.channelName) {
    result = result.filter(v => v.channelName === filters.channelName);
  }

  if (filters.country) {
    result = result.filter(v => v.country === filters.country);
  }

  result.sort((a, b) => {
    let dateA: number;
    let dateB: number;

    if (sortOptions.sortBy === 'recordingDate') {
      dateA = a.recordingDate ? a.recordingDate.getTime() : 0;
      dateB = b.recordingDate ? b.recordingDate.getTime() : 0;
    } else {
      dateA = a.publishedAt.getTime();
      dateB = b.publishedAt.getTime();
    }

    if (sortOptions.sortOrder === 'ascending') {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });

  return result;
};

const computeAvailableChannels = (videos: Video[]) => {
  const channels = new Set(videos.map(v => v.channelName).filter(Boolean));
  return Array.from(channels).sort();
};

const computeAvailableCountries = (videos: Video[]) => {
  const countries = new Set(videos.map(v => v.country).filter((c): c is string => c !== null));
  return Array.from(countries).sort();
};

export const useVideosStore = create<VideosState>((set, get) => ({
  status: 'initial',
  allVideos: [],
  filteredVideos: [],
  filters: defaultFilters,
  sortOptions: defaultSortOptions,
  isRefreshing: false,
  errorMessage: null,
  availableChannels: [],
  availableCountries: [],

  loadVideos: async (getVideosUseCase: GetVideos) => {
    set({ status: 'loading', errorMessage: null });
    
    const result = await getVideosUseCase.execute({
      channelIds: CHANNEL_IDS,
      forceRefresh: false,
    });

    if (result.ok) {
      const state = get();
      set({
        status: 'loaded',
        allVideos: result.data,
        filteredVideos: applyFiltersAndSort(result.data, state.filters, state.sortOptions),
        availableChannels: computeAvailableChannels(result.data),
        availableCountries: computeAvailableCountries(result.data),
      });
    } else {
      set({ status: 'error', errorMessage: result.error.message });
    }
  },

  refreshVideos: async (getVideosUseCase: GetVideos) => {
    set({ isRefreshing: true, errorMessage: null });
    
    const result = await getVideosUseCase.execute({
      channelIds: CHANNEL_IDS,
      forceRefresh: true,
    });

    if (!result.ok) {
      set({ isRefreshing: false, errorMessage: result.error.message, status: 'error' });
      return;
    }

    const state = get();
    set({
      status: 'loaded',
      isRefreshing: false,
      allVideos: result.data,
      filteredVideos: applyFiltersAndSort(result.data, state.filters, state.sortOptions),
      availableChannels: computeAvailableChannels(result.data),
      availableCountries: computeAvailableCountries(result.data),
    });
  },

  filterByChannel: (channelName) => {
    set((state) => {
      const newFilters = { ...state.filters, channelName };
      return {
        filters: newFilters,
        filteredVideos: applyFiltersAndSort(state.allVideos, newFilters, state.sortOptions),
      };
    });
  },

  filterByCountry: (country) => {
    set((state) => {
      const newFilters = { ...state.filters, country };
      return {
        filters: newFilters,
        filteredVideos: applyFiltersAndSort(state.allVideos, newFilters, state.sortOptions),
      };
    });
  },

  sortVideos: (sortBy, sortOrder) => {
    set((state) => {
      const newSortOptions = { sortBy, sortOrder };
      return {
        sortOptions: newSortOptions,
        filteredVideos: applyFiltersAndSort(state.allVideos, state.filters, newSortOptions),
      };
    });
  },

  clearFilters: () => {
    set((state) => ({
      filters: defaultFilters,
      sortOptions: defaultSortOptions,
      filteredVideos: applyFiltersAndSort(state.allVideos, defaultFilters, defaultSortOptions),
    }));
  },
}));
