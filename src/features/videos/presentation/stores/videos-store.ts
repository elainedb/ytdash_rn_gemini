import { create } from 'zustand';
import { Video } from '../../domain/entities/video';
import { GetVideos } from '../../domain/usecases/get-videos';

export const CHANNEL_IDS = [
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
}

export interface VideosActions {
  loadVideos: (getVideosUseCase: GetVideos) => Promise<void>;
  refreshVideos: (getVideosUseCase: GetVideos) => Promise<void>;
  filterByChannel: (channelName: string | null) => void;
  filterByCountry: (country: string | null) => void;
  sortVideos: (sortBy: SortOptions['sortBy'], sortOrder: SortOptions['sortOrder']) => void;
  clearFilters: () => void;
}

interface VideosStore extends VideosState, VideosActions {}

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
    let dateA: Date;
    let dateB: Date;

    if (sortOptions.sortBy === 'recordingDate') {
      dateA = a.recordingDate || new Date(0);
      dateB = b.recordingDate || new Date(0);
      // Fallback to published date if no recording date
      if (!a.recordingDate) dateA = a.publishedAt;
      if (!b.recordingDate) dateB = b.publishedAt;
    } else {
      dateA = a.publishedAt;
      dateB = b.publishedAt;
    }

    const timeA = dateA.getTime();
    const timeB = dateB.getTime();

    if (sortOptions.sortOrder === 'ascending') {
      return timeA - timeB;
    } else {
      return timeB - timeA;
    }
  });

  return result;
};

export const useVideosStore = create<VideosStore>((set, get) => ({
  status: 'initial',
  allVideos: [],
  filteredVideos: [],
  filters: {
    channelName: null,
    country: null,
  },
  sortOptions: {
    sortBy: 'publishedDate',
    sortOrder: 'descending',
  },
  isRefreshing: false,
  errorMessage: null,

  availableChannels: () => {
    const { allVideos } = get();
    const channels = new Set(allVideos.map(v => v.channelName));
    return Array.from(channels).sort();
  },

  availableCountries: () => {
    const { allVideos } = get();
    const countries = new Set(allVideos.map(v => v.country).filter((c): c is string => c !== null));
    return Array.from(countries).sort();
  },

  loadVideos: async (getVideosUseCase: GetVideos) => {
    set({ status: 'loading', errorMessage: null });
    const result = await getVideosUseCase.execute({ channelIds: CHANNEL_IDS, forceRefresh: false });
    
    if (result.ok) {
      const { filters, sortOptions } = get();
      set({ 
        status: 'loaded', 
        allVideos: result.data,
        filteredVideos: applyFiltersAndSort(result.data, filters, sortOptions)
      });
    } else {
      set({ status: 'error', errorMessage: (result as any).error.message });
    }
  },

  refreshVideos: async (getVideosUseCase: GetVideos) => {
    set({ isRefreshing: true, errorMessage: null });
    const result = await getVideosUseCase.execute({ channelIds: CHANNEL_IDS, forceRefresh: true });
    
    if (result.ok) {
      const { filters, sortOptions } = get();
      set({ 
        status: 'loaded',
        allVideos: result.data,
        filteredVideos: applyFiltersAndSort(result.data, filters, sortOptions),
        isRefreshing: false
      });
    } else {
      set({ errorMessage: (result as any).error.message, isRefreshing: false, status: 'error' });
    }
  },

  filterByChannel: (channelName: string | null) => {
    set((state) => {
      const newFilters = { ...state.filters, channelName };
      return {
        filters: newFilters,
        filteredVideos: applyFiltersAndSort(state.allVideos, newFilters, state.sortOptions)
      };
    });
  },

  filterByCountry: (country: string | null) => {
    set((state) => {
      const newFilters = { ...state.filters, country };
      return {
        filters: newFilters,
        filteredVideos: applyFiltersAndSort(state.allVideos, newFilters, state.sortOptions)
      };
    });
  },

  sortVideos: (sortBy: SortOptions['sortBy'], sortOrder: SortOptions['sortOrder']) => {
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
      const newFilters: FilterOptions = { channelName: null, country: null };
      const newSortOptions: SortOptions = { sortBy: 'publishedDate', sortOrder: 'descending' };
      return {
        filters: newFilters,
        sortOptions: newSortOptions,
        filteredVideos: applyFiltersAndSort(state.allVideos, newFilters, newSortOptions)
      };
    });
  }
}));
