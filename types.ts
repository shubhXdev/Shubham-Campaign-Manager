export interface CampaignResponse {
  id: string;
  timestamp: string; // ISO string or format from Google Forms
  name: string; // Mapped from "Campaign Incharge"
  email: string;
  location: string; // Mapped from "Place 1"
  message: string; // Mapped from "Any Remark"
  photoUrls: string[]; // Changed to array
  videoUrls: string[]; // Changed to array
  sentiment?: 'positive' | 'neutral' | 'negative';
  tags?: string[];
  // Specific fields for this campaign sheet
  staffInvolved?: string;
  pamphletsUsed?: string;
  dateOfDrive?: string; // Mapped from "Date" column
}

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
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