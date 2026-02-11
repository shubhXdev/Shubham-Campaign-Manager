export interface CampaignResponse {
  id: string;
  timestamp: string; 
  name: string; 
  email: string;
  location: string; 
  message: string; 
  photoUrls: string[]; 
  videoUrls: string[]; 
  sentiment?: 'positive' | 'neutral' | 'negative';
  tags?: string[];
  staffInvolved?: string;
  pamphletsUsed?: string;
  dateOfDrive?: string;
  // Dynamic container for any other columns in the Google Sheet
  extraFields: Record<string, string>;
}

export interface DateRange {
  startDate: string; 
  endDate: string; 
}

export interface FilterState {
  dateRange: DateRange;
  searchQuery: string;
  hasMedia: boolean;
}

export enum ViewMode {
  GRID = 'GRID',
  LIST = 'LIST',
  ANALYTICS = 'ANALYTICS'
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
}