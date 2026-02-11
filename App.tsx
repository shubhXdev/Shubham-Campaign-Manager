import React, { useState, useMemo, useEffect } from 'react';
import { CampaignResponse, FilterState, ViewMode, MediaItem } from './types';
import { fetchCampaignData, extractSheetId, DEFAULT_SHEET_ID } from './utils/helpers';
import { DateRangePicker } from './components/DateRangePicker';
import { ResponseCard } from './components/ResponseCard';
import { MediaPreview } from './components/MediaPreview';
import { analyzeCampaignData } from './services/geminiService';
import { 
  LayoutDashboard, 
  Table as TableIcon, 
  Download, 
  Sparkles, 
  Loader2, 
  Search,
  AlertCircle,
  Image as ImageIcon,
  Video,
  RefreshCcw,
  Hexagon,
  Cpu,
  Settings,
  Save,
  Link as LinkIcon
} from 'lucide-react';

interface PreviewState {
  items: MediaItem[];
  currentIndex: number;
}

const App: React.FC = () => {
  const [data, setData] = useState<CampaignResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  
  // Sheet Configuration State
  const [sheetId, setSheetId] = useState<string>(() => localStorage.getItem('campaign_sheet_id') || DEFAULT_SHEET_ID);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsUrl, setSettingsUrl] = useState('');

  const [filter, setFilter] = useState<FilterState>({
    dateRange: { startDate: '', endDate: '' },
    searchQuery: '',
    hasMedia: false,
  });
  
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const realData = await fetchCampaignData(sheetId);
      if (realData.length === 0) {
        console.warn("No data fetched. Sheet might be empty.");
        setData([]);
        setError("Connected to sheet but found no rows. Please check if the sheet has data.");
      } else {
        setData(realData);
      }
    } catch (err: any) {
      console.error("Failed to load sheet data", err);
      setData([]);
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sheetId]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filter.dateRange.startDate) {
        const itemDate = new Date(item.timestamp).setHours(0,0,0,0);
        const startDate = new Date(filter.dateRange.startDate).setHours(0,0,0,0);
        if (itemDate < startDate) return false;
      }
      if (filter.dateRange.endDate) {
        const itemDate = new Date(item.timestamp).setHours(0,0,0,0);
        const endDate = new Date(filter.dateRange.endDate).setHours(0,0,0,0);
        if (itemDate > endDate) return false;
      }

      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matches = 
          item.name.toLowerCase().includes(query) || 
          item.message.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query);
        if (!matches) return false;
      }

      if (filter.hasMedia) {
        if (item.photoUrls.length === 0 && item.videoUrls.length === 0) return false;
      }

      return true;
    });
  }, [data, filter]);

  const handlePrint = () => window.print();

  const handleAIAnalysis = async () => {
    if (filteredData.length === 0) return;
    setAnalyzing(true);
    setShowAnalysisModal(true);
    const result = await analyzeCampaignData(filteredData);
    setAnalysisResult(result);
    setAnalyzing(false);
  };

  const openMediaPreview = (items: MediaItem[], index: number) => {
    setPreviewState({ items, currentIndex: index });
  };

  const handleNextMedia = () => {
    if (previewState && previewState.currentIndex < previewState.items.length - 1) {
      setPreviewState({ ...previewState, currentIndex: previewState.currentIndex + 1 });
    }
  };

  const handlePrevMedia = () => {
    if (previewState && previewState.currentIndex > 0) {
      setPreviewState({ ...previewState, currentIndex: previewState.currentIndex - 1 });
    }
  };

  const saveSettings = () => {
    const extracted = extractSheetId(settingsUrl);
    if (extracted) {
      setSheetId(extracted);
      localStorage.setItem('campaign_sheet_id', extracted);
      setShowSettings(false);
      setSettingsUrl('');
    } else {
      alert("Invalid Google Sheet URL or ID");
    }
  };

  const resetSettings = () => {
    setSheetId(DEFAULT_SHEET_ID);
    localStorage.removeItem('campaign_sheet_id');
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-slate-50/50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {/* Common Logo Design */}
              <div className="relative w-9 h-9 flex items-center justify-center bg-slate-900 rounded-lg shadow-md text-white">
                <Hexagon size={32} className="absolute text-slate-800" strokeWidth={1.5} />
                <span className="font-bold text-lg relative z-10 text-orange-500">S</span>
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight text-slate-900">Shubham Campaign</h1>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Manager Portal</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Responses</p>
                <p className="font-mono font-bold text-lg leading-none text-slate-700">{filteredData.length}</p>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                title="Configuration"
              >
                <Settings size={20} />
              </button>

              <button 
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors text-sm disabled:opacity-50 text-slate-700 font-medium"
              >
                <RefreshCcw size={14} className={`text-orange-500 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {error && (
            <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-start gap-3 shadow-sm no-print animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Data Source Alert</h3>
                <p className="text-sm opacity-90">{error}</p>
                <button 
                  onClick={() => setShowSettings(true)} 
                  className="mt-2 text-xs font-bold underline hover:text-amber-900"
                >
                  Check Sheet Configuration
                </button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center mb-8 no-print">
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search name, message..." 
                  value={filter.searchQuery}
                  onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm text-slate-700"
                />
              </div>
              <DateRangePicker 
                dateRange={filter.dateRange}
                onChange={(r) => setFilter(prev => ({ ...prev, dateRange: r }))}
                onClear={() => setFilter(prev => ({ ...prev, dateRange: { startDate: '', endDate: '' } }))}
              />
              <button 
                onClick={() => setFilter(prev => ({ ...prev, hasMedia: !prev.hasMedia }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all shadow-sm ${
                  filter.hasMedia 
                    ? 'bg-orange-50 border-orange-200 text-orange-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ImageIcon size={16} />
                <span>With Media</span>
              </button>
            </div>

            <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
               <button
                onClick={handleAIAnalysis}
                disabled={loading || filteredData.length === 0}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-slate-200"
              >
                <Sparkles size={16} className="text-orange-400" />
                <span>AI Insights</span>
              </button>
              
              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

              <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                <button 
                  onClick={() => setViewMode(ViewMode.GRID)}
                  className={`p-1.5 rounded ${viewMode === ViewMode.GRID ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutDashboard size={18} />
                </button>
                <button 
                  onClick={() => setViewMode(ViewMode.LIST)}
                  className={`p-1.5 rounded ${viewMode === ViewMode.LIST ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <TableIcon size={18} />
                </button>
              </div>

              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
              >
                <Download size={16} />
                <span className="hidden sm:inline">PDF Report</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Loader2 className="animate-spin mb-3 text-orange-500" size={32} />
              <p>Loading campaign data...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              <AlertCircle size={32} className="mb-2 opacity-50" />
              <p>No responses found matching your filters.</p>
              <button 
                onClick={() => setFilter({ dateRange: { startDate: '', endDate: '' }, searchQuery: '', hasMedia: false })}
                className="mt-4 text-orange-600 font-medium hover:underline text-sm"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              {viewMode === ViewMode.GRID ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredData.map(item => (
                    <ResponseCard 
                      key={item.id} 
                      data={item} 
                      onMediaClick={openMediaPreview} 
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Campaign Incharge</th>
                          <th className="px-6 py-3">Place</th>
                          <th className="px-6 py-3">Staff</th>
                          <th className="px-6 py-3">Pamphlets</th>
                          <th className="px-6 py-3">Remark</th>
                          <th className="px-6 py-3 text-center">Sentiment</th>
                          <th className="px-6 py-3 text-right">Media</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((item) => {
                           // Prepare media items for the list view click handler
                           const allMediaItems: MediaItem[] = [
                              ...item.photoUrls.map(url => ({ url, type: 'image' as const })),
                              ...item.videoUrls.map(url => ({ url, type: 'video' as const }))
                            ];
                           return (
                            <tr key={item.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="px-6 py-4 font-medium whitespace-nowrap">
                                  {item.dateOfDrive}
                              </td>
                              <td className="px-6 py-4 font-semibold text-slate-900">{item.name}</td>
                              <td className="px-6 py-4">{item.location}</td>
                              <td className="px-6 py-4">{item.staffInvolved || '-'}</td>
                              <td className="px-6 py-4">{item.pamphletsUsed || '-'}</td>
                              <td className="px-6 py-4 max-w-xs truncate" title={item.message}>{item.message || '-'}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  item.sentiment === 'positive' ? 'text-green-600 bg-green-50' :
                                  item.sentiment === 'negative' ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100'
                                }`}>
                                  {item.sentiment}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {item.photoUrls.length > 0 && (
                                    <button onClick={() => openMediaPreview(allMediaItems, 0)} className="text-slate-400 hover:text-orange-500 flex items-center gap-1">
                                      <ImageIcon size={16} />
                                      <span className="text-xs">{item.photoUrls.length}</span>
                                    </button>
                                  )}
                                  {item.videoUrls.length > 0 && (
                                    <button 
                                      onClick={() => {
                                        // Find index of first video
                                        const videoIndex = allMediaItems.findIndex(m => m.type === 'video');
                                        openMediaPreview(allMediaItems, videoIndex >= 0 ? videoIndex : 0);
                                      }} 
                                      className="text-slate-400 hover:text-orange-500 flex items-center gap-1"
                                    >
                                      <Video size={16} />
                                      <span className="text-xs">{item.videoUrls.length}</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      {/* Branding Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
              <p>&copy; {new Date().getFullYear()} Shubham Campaign Manager. All rights reserved.</p>
              <div className="flex items-center gap-2">
                  <span className="opacity-75">Powered by</span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      <Cpu size={14} className="text-orange-500" />
                      <span>Shubham Technologies</span>
                  </div>
              </div>
          </div>
      </footer>

      {previewState && (
        <MediaPreview 
          item={previewState.items[previewState.currentIndex]}
          onClose={() => setPreviewState(null)}
          onNext={previewState.currentIndex < previewState.items.length - 1 ? handleNextMedia : undefined}
          onPrev={previewState.currentIndex > 0 ? handlePrevMedia : undefined}
        />
      )}

      {/* AI Analysis Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div className="flex items-center gap-2 text-indigo-700">
                <Sparkles size={20} className={analyzing ? "animate-pulse" : ""} />
                <h3 className="font-bold text-lg">AI Campaign Insights</h3>
              </div>
              <button 
                onClick={() => setShowAnalysisModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow prose prose-slate max-w-none">
              {analyzing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles size={16} className="text-indigo-600" />
                    </div>
                  </div>
                  <p className="text-slate-500 font-medium">Analyzing {filteredData.length} responses with Gemini...</p>
                </div>
              ) : (
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {analysisResult}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
              <button 
                onClick={() => setShowAnalysisModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-900">
                <Settings size={20} />
                <h3 className="font-bold text-lg">Configuration</h3>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Google Sheet URL or ID</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={settingsUrl}
                    onChange={(e) => setSettingsUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..." 
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Paste the full URL of your Google Form Responses sheet. Ensure the sheet is 
                  <span className="font-medium text-slate-700"> Published to Web</span> (File &gt; Share &gt; Publish to web) or shared with "Anyone with the link".
                </p>
                {sheetId !== DEFAULT_SHEET_ID && (
                  <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs flex items-center justify-between">
                     <span>Currently using custom sheet ID: {sheetId.substring(0, 10)}...</span>
                     <button onClick={resetSettings} className="text-blue-600 hover:text-blue-800 underline">Reset to Default</button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveSettings}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                Save & Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
