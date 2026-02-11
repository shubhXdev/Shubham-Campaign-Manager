import { CampaignResponse } from '../types';
import Papa from 'papaparse';

export const DEFAULT_SHEET_ID = '18fCHeqsvt7FIpXNBAHNj-AssUAKSRRJOFXugL1s-Wp4';

export const extractDriveId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/id=([a-zA-Z0-9_-]+)/) || 
                url.match(/\/d\/([a-zA-Z0-9_-]+)/) || 
                url.match(/open\?id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

export const extractSheetId = (url: string): string | null => {
  if (!url) return null;
  if (url.length > 20 && !url.includes('/')) return url;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

const extractAllDriveIds = (text: string): string[] => {
  if (!text) return [];
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

const parseDateToISO = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString();
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toISOString();
  const parts = dateStr.split(/[-/.]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const fullYear = year < 100 ? 2000 + year : year;
    const d2 = new Date(fullYear, month, day);
    if (!isNaN(d2.getTime())) return d2.toISOString();
  }
  return new Date().toISOString();
};

export const fetchCampaignData = async (sheetId: string = DEFAULT_SHEET_ID): Promise<CampaignResponse[]> => {
  const endpoints = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Form%20Responses%201`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv`
  ];

  let csvText = '';
  let successfulUrl = '';
  let lastError: any = null;
  
  for (const url of endpoints) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) throw new Error("Private sheet");
        csvText = await response.text();
        if (csvText.length > 0 && (csvText.includes(',') || csvText.includes('\n'))) {
          successfulUrl = url;
          break; 
        }
      }
    } catch (e) {
      lastError = e;
    }
  }

  if (!csvText) throw new Error("Failed to load Google Sheet.");

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const normalize = (str: string) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

        const mappedData: CampaignResponse[] = data.map((row, index) => {
          const rowKeys = Object.keys(row);
          const usedKeysSet = new Set<string>();

          const getValue = (keywords: string[]) => {
            const foundKey = rowKeys.find(key => {
              const nKey = normalize(key);
              return keywords.some(kw => nKey === normalize(kw) || nKey.includes(normalize(kw)));
            });
            if (foundKey) usedKeysSet.add(foundKey);
            return foundKey ? row[foundKey]?.trim() : '';
          };

          const rawDate = getValue(['date']);
          const timestamp = parseDateToISO(rawDate); 
          const name = getValue(['campaign incharge', 'incharge', 'name']) || 'Unknown Incharge';
          
          let location = getValue(['place 1', 'place']);
          const p2Key = rowKeys.find(k => normalize(k) === 'place2');
          const p3Key = rowKeys.find(k => normalize(k) === 'place3');
          if (p2Key) { location = `${location}, ${row[p2Key]}`; usedKeysSet.add(p2Key); }
          if (p3Key) { location = `${location}, ${row[p3Key]}`; usedKeysSet.add(p3Key); }
          
          const message = getValue(['any remark', 'remark', 'message', 'comments']) || '';
          const staffInvolved = getValue(['staff involve', 'staff']);
          const pamphletsUsed = getValue(['total pamplet', 'pamplet']);

          // Media extraction
          let photoIds: string[] = [];
          let videoIds: string[] = [];
          rowKeys.forEach(key => {
             const cellValue = row[key];
             const ids = extractAllDriveIds(cellValue);
             if (ids.length > 0) {
                 const nKey = normalize(key);
                 if (nKey.includes('video') || nKey.includes('movie')) videoIds.push(...ids);
                 else photoIds.push(...ids);
                 usedKeysSet.add(key);
             }
          });

          // Extra fields (Anything not used yet)
          const extraFields: Record<string, string> = {};
          rowKeys.forEach(key => {
            if (!usedKeysSet.has(key) && row[key] && normalize(key) !== 'timestamp') {
              extraFields[key] = row[key];
            }
          });

          const combinedText = (message + ' ' + location).toLowerCase();
          let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
          if (combinedText.match(/good|great|success|done|completed|excellent/)) sentiment = 'positive';
          else if (combinedText.match(/issue|problem|bad|pending|stuck|poor/)) sentiment = 'negative';

          return {
            id: `row-${index}`,
            timestamp,
            dateOfDrive: rawDate || timestamp.split('T')[0],
            name,
            email: '', 
            location: location || 'Not Specified',
            message,
            staffInvolved,
            pamphletsUsed,
            photoUrls: [...new Set(photoIds)].map(id => `https://lh3.googleusercontent.com/d/${id}`),
            videoUrls: [...new Set(videoIds)].map(id => `https://drive.google.com/file/d/${id}/preview`),
            sentiment,
            extraFields
          };
        });

        const validData = mappedData.filter(d => d.name || d.location || d.message);
        validData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(validData);
      },
      error: (err: any) => reject(err)
    });
  });
};

export const parseCSV = (csvText: string): CampaignResponse[] => [];
export const generateMockData = (): CampaignResponse[] => [];
export const formatDate = (dateString: string): string => dateString;