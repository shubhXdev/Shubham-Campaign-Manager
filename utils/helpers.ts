import { CampaignResponse } from '../types';
import Papa from 'papaparse';

const SHEET_ID = '18fCHeqsvt7FIpXNBAHNj-AssUAKSRRJOFXugL1s-Wp4';

// Define multiple endpoints to try. 
const ENDPOINTS = [
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Form%20Responses%201`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`,
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/pub?output=csv`
];

const extractDriveId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/id=([a-zA-Z0-9_-]+)/) || 
                url.match(/\/d\/([a-zA-Z0-9_-]+)/) || 
                url.match(/open\?id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

// New helper to extract ALL IDs from a cell containing multiple links (comma/newline separated)
const extractAllDriveIds = (text: string): string[] => {
  if (!text) return [];
  // Split by comma, newline, or space to handle various delimiters
  const parts = text.split(/[\n, ]+/).map(p => p.trim()).filter(p => p.length > 0);
  const ids: string[] = [];
  for (const part of parts) {
    const id = extractDriveId(part);
    if (id && !ids.includes(id)) {
      ids.push(id);
    }
  }
  return ids;
};

// Helper to attempt parsing DD/MM/YYYY or similar formats to a sortable ISO string
const parseDateToISO = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString();
  
  // Try standard Date parse first
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toISOString();

  // Handle DD/MM/YYYY common in Sheets
  const parts = dateStr.split(/[-/.]/);
  if (parts.length === 3) {
    // Assume DD/MM/YYYY if first part > 12 (basic heuristic) or just try it
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    // Check if year is 2 digits
    const fullYear = year < 100 ? 2000 + year : year;
    
    const d2 = new Date(fullYear, month, day);
    if (!isNaN(d2.getTime())) return d2.toISOString();
  }
  
  return new Date().toISOString(); // Fallback
};

export const fetchCampaignData = async (): Promise<CampaignResponse[]> => {
  let csvText = '';
  let successfulUrl = '';
  let lastError: any = null;
  
  // Try all endpoints sequentially
  for (const url of ENDPOINTS) {
    try {
      console.log(`Attempting to fetch from: ${url}`);
      const response = await fetch(url, { method: 'GET' });
      
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error("Sheet is likely private (received HTML login page instead of CSV).");
        }

        csvText = await response.text();
        if (csvText.length > 0 && (csvText.includes(',') || csvText.includes('\n'))) {
          successfulUrl = url;
          console.log(`Successfully fetched from ${url}`);
          break; 
        }
      } else {
        throw new Error(`Status ${response.status}: ${response.statusText}`);
      }
    } catch (e) {
      console.warn(`Fetch failed for ${url}`, e);
      lastError = e;
    }
  }

  if (!csvText) {
    throw new Error(`Failed to load Google Sheet. Last error: ${lastError?.message || 'Unknown network error'}.`);
  }

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        if (data.length === 0) {
          console.warn("Parsed CSV but found 0 rows.");
          resolve([]);
          return;
        }

        const headers = results.meta.fields || Object.keys(data[0]);
        console.log("Headers detected:", headers);

        const normalize = (str: string) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

        const mappedData: CampaignResponse[] = data.map((row, index) => {
          const rowKeys = Object.keys(row);
          
          // Basic text getter
          const getValue = (keywords: string[]) => {
            const foundKey = rowKeys.find(key => {
              const nKey = normalize(key);
              return keywords.some(kw => nKey === normalize(kw) || nKey.includes(normalize(kw)));
            });
            return foundKey ? row[foundKey]?.trim() : '';
          };

          // --- Specific Mapping ---
          
          // 1. Date (Priority: 'Date' column)
          const rawDate = getValue(['date']);
          const timestamp = parseDateToISO(rawDate); 
          
          // 2. Name -> Campaign Incharge
          const name = getValue(['campaign incharge', 'incharge', 'name']) || 'Unknown Incharge';
          
          // 3. Location -> Place 1
          let location = getValue(['place 1', 'place']);
          const place2 = getValue(['place 2']);
          const place3 = getValue(['place 3']);
          
          if (place2 && place2.toLowerCase() !== 'na') location = location ? `${location}, ${place2}` : place2;
          if (place3 && place3.toLowerCase() !== 'na') location = location ? `${location}, ${place3}` : place3;
          
          // 4. Message -> Any Remark
          const message = getValue(['any remark', 'remark', 'message', 'comments']) || '';
          
          // 5. Custom Fields
          const staffInvolved = getValue(['staff involve', 'staff']);
          const pamphletsUsed = getValue(['total pamplet', 'pamplet']);

          // 6. Media - Aggressive Extraction (Scan ALL columns)
          let photoIds: string[] = [];
          let videoIds: string[] = [];

          rowKeys.forEach(key => {
             const cellValue = row[key];
             if (!cellValue) return;

             // Extract IDs from this cell (handles comma separated lists etc)
             const ids = extractAllDriveIds(cellValue);
             
             if (ids.length > 0) {
                 const nKey = normalize(key);
                 
                 // Heuristic: If column name strictly implies video/movie, treat as video
                 if (nKey.includes('video') || nKey.includes('movie') || nKey.includes('mp4') || nKey.includes('vid')) {
                     videoIds.push(...ids);
                 } else {
                     // Default to photos for everything else (images, photos, uploads, files, etc)
                     // This catches generic "Upload" columns or "Files" columns that might be missing keywords
                     photoIds.push(...ids);
                 }
             }
          });

          // Remove duplicates
          photoIds = [...new Set(photoIds)];
          videoIds = [...new Set(videoIds)];

          const photoUrls = photoIds.map(id => `https://lh3.googleusercontent.com/d/${id}`);
          const videoUrls = videoIds.map(id => `https://drive.google.com/file/d/${id}/preview`);

          // Sentiment
          const combinedText = (message + ' ' + location).toLowerCase();
          let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
          if (combinedText.match(/good|great|success|done|completed|excellent/)) sentiment = 'positive';
          else if (combinedText.match(/issue|problem|bad|pending|stuck|poor/)) sentiment = 'negative';

          return {
            id: `row-${index}`,
            timestamp: timestamp, // Used for internal sorting/filtering
            dateOfDrive: rawDate || timestamp.split('T')[0], // Display string
            name: name,
            email: '', 
            location: location || 'Not Specified',
            message: message,
            staffInvolved: staffInvolved,
            pamphletsUsed: pamphletsUsed,
            photoUrls: photoUrls,
            videoUrls: videoUrls,
            sentiment
          };
        });

        // Validation
        const validData = mappedData.filter(d => 
          d.name || d.location || d.message
        );

        validData.sort((a, b) => {
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();
            if (isNaN(dateA)) return 1;
            if (isNaN(dateB)) return -1;
            return dateB - dateA;
        });
        
        console.log(`Parsed ${validData.length} valid rows from ${successfulUrl}`);
        resolve(validData);
      },
      error: (err: any) => reject(err)
    });
  });
};

export const parseCSV = (csvText: string): CampaignResponse[] => [];
export const generateMockData = (): CampaignResponse[] => [];
export const formatDate = (dateString: string): string => dateString;