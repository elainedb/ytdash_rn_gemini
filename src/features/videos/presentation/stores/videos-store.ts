import { create } from 'zustand';
import { Video } from '../../domain/entities/video';
import { container } from '../../../../core/di/container';

const CHANNEL_IDS = [
  'UCynoa1DjwnvHAowA_jiMEAQ',
  'UCK0KOjX3beyB9nzonls0cuw',
  'UCACkIrvrGAQ7kuc0hMVwvmA',
  'UCtWRAKKvOEA0CXOue9BG8ZA',
];

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

  loadVideos: () => Promise<void>;
  refreshVideos: () => Promise<void>;
  filterByChannel: (channelName: string | null) => void;
  filterByCountry: (country: string | null) => void;
  sortVideos: (sortBy: 'publishedDate' | 'recordingDate', sortOrder: 'ascending' | 'descending') => void;
  clearFilters: () => void;
}

const applyFiltersAndSort = (videos: Video[], filters: FilterOptions, sortOptions: SortOptions): Video[] => {
  let result = [...videos];

  if (filters.channelName) {
    result = result.filter(v => v.channelName === filters.channelName);
  }

  if (filters.country) {
    result = result.filter(v => v.country === filters.country);
  }

  result.sort((a, b) => {
    let dateA: number, dateB: number;

    if (sortOptions.sortBy === 'recordingDate') {
      dateA = a.recordingDate ? a.recordingDate.getTime() : a.publishedAt.getTime();
      dateB = b.recordingDate ? b.recordingDate.getTime() : b.publishedAt.getTime();
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

const extractAvailableOptions = (videos: Video[]) => {
  const channels = new Set<string>();
  const countries = new Set<string>();

  videos.forEach(v => {
    channels.add(v.channelName);
    if (v.country) {
      countries.add(v.country);
    }
  });

  return {
    availableChannels: Array.from(channels).sort(),
    availableCountries: Array.from(countries).sort(),
  };
};

export const useVideosStore = create<VideosState>((set, get) => ({
  status: 'initial',
  allVideos: [],
  filteredVideos: [],
  filters: { channelName: null, country: null },
  sortOptions: { sortBy: 'publishedDate', sortOrder: 'descending' },
  isRefreshing: false,
  errorMessage: null,
  availableChannels: [],
  availableCountries: [],

  loadVideos: async () => {
    set({ status: 'loading', errorMessage: null });
    const result = await container.getVideos.execute({ channelIds: CHANNEL_IDS, forceRefresh: false });
    
    if (result.ok) {
      const { filters, sortOptions } = get();
      const filtered = applyFiltersAndSort(result.data, filters, sortOptions);
      const options = extractAvailableOptions(result.data);
      
      set({ 
        status: 'loaded', 
        allVideos: result.data, 
        filteredVideos: filtered,
        availableChannels: options.availableChannels,
        availableCountries: options.availableCountries
      });
    } else {
      set({ status: 'error', errorMessage: result.error.message });
    }
  },

  refreshVideos: async () => {
    set({ isRefreshing: true, errorMessage: null });
    const result = await container.getVideos.execute({ channelIds: CHANNEL_IDS, forceRefresh: true });
    
    if (result.ok) {
      const { filters, sortOptions } = get();
      const filtered = applyFiltersAndSort(result.data, filters, sortOptions);
      const options = extractAvailableOptions(result.data);

      set({ 
        status: 'loaded', 
        allVideos: result.data, 
        filteredVideos: filtered,
        availableChannels: options.availableChannels,
        availableCountries: options.availableCountries,
        isRefreshing: false 
      });
    } else {
      set({ isRefreshing: false, errorMessage: result.error.message });
    }
  },

  filterByChannel: (channelName) => {
    set((state) => {
      const newFilters = { ...state.filters, channelName };
      return {
        filters: newFilters,
        filteredVideos: applyFiltersAndSort(state.allVideos, newFilters, state.sortOptions)
      };
    });
  },

  filterByCountry: (country) => {
    set((state) => {
      const newFilters = { ...state.filters, country };
      return {
        filters: newFilters,
        filteredVideos: applyFiltersAndSort(state.allVideos, newFilters, state.sortOptions)
      };
    });
  },

  sortVideos: (sortBy, sortOrder) => {
    set((state) => {
      const newSortOptions = { sortBy, sortOrder };
      return {
        sortOptions: newSortOptions,
        filteredVideos: applyFiltersAndSort(state.allVideos, state.filters, newSortOptions)
      };
    });
  },

  clearFilters: () => {
    set((state) => {
      const newFilters = { channelName: null, country: null };
      const newSortOptions: SortOptions = { sortBy: 'publishedDate', sortOrder: 'descending' };
      return {
        filters: newFilters,
        sortOptions: newSortOptions,
        filteredVideos: applyFiltersAndSort(state.allVideos, newFilters, newSortOptions)
      };
    });
  }
}));
