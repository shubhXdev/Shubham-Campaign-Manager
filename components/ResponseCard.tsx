import React from 'react';
import { CampaignResponse, MediaItem } from '../types';
import { MapPin, Calendar, Users, FileText, Play, Info, Tag } from 'lucide-react';

interface Props {
  data: CampaignResponse;
  onMediaClick: (items: MediaItem[], index: number) => void;
}

export const ResponseCard: React.FC<Props> = ({ data, onMediaClick }) => {
  const allMedia: MediaItem[] = [
    ...data.photoUrls.map(url => ({ url, type: 'image' as const })),
    ...data.videoUrls.map(url => ({ url, type: 'video' as const }))
  ];

  const hasMedia = allMedia.length > 0;
  const displayMedia = allMedia.slice(0, 4);
  const remainingCount = allMedia.length - 4;

  // Identify extra fields to display
  // Fix: Explicitly cast entries to [string, string][] to resolve type inference issue where values were treated as 'unknown'
  const extraEntries = Object.entries(data.extraFields || {}) as [string, string][];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full card-break-inside-avoid">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-start">
        <div>
          <h3 className="font-bold text-slate-900 line-clamp-1 leading-tight" title={data.name}>
            {data.name}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
            <Calendar size={10} className="text-orange-400" />
            {data.dateOfDrive}
          </p>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
          data.sentiment === 'positive' ? 'bg-green-50 text-green-600 border border-green-100' :
          data.sentiment === 'negative' ? 'bg-red-50 text-red-600 border border-red-100' :
          'bg-slate-50 text-slate-500 border border-slate-100'
        }`}>
          {data.sentiment}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow space-y-4">
        {/* Primary Location */}
        <div className="flex items-start gap-2 text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
          <MapPin size={14} className="mt-0.5 shrink-0 text-orange-500" />
          <span className="text-xs font-semibold leading-relaxed">{data.location}</span>
        </div>

        {/* Metrics Grid (Standard + Simple Extras) */}
        <div className="grid grid-cols-2 gap-2">
          {data.staffInvolved && (
            <div className="flex items-center gap-2 p-2 bg-indigo-50/30 rounded-lg border border-indigo-100/50">
              <Users size={12} className="text-indigo-500" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400">Staff</span>
                <span className="text-xs font-bold text-indigo-700">{data.staffInvolved}</span>
              </div>
            </div>
          )}
          {data.pamphletsUsed && (
            <div className="flex items-center gap-2 p-2 bg-emerald-50/30 rounded-lg border border-emerald-100/50">
              <FileText size={12} className="text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400">Pamphlets</span>
                <span className="text-xs font-bold text-emerald-700">{data.pamphletsUsed}</span>
              </div>
            </div>
          )}
          
          {/* Automatically show any extra numeric or short fields in the grid */}
          {/* Fix: Casting ensures 'v' is correctly typed as string for .length access */}
          {extraEntries.filter(([_, v]) => v.length < 15).slice(0, 2).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <Tag size={12} className="text-slate-400" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400 truncate w-20" title={k}>{k}</span>
                <span className="text-xs font-bold text-slate-700 truncate w-20">{v}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Dynamic Detail List for longer extra fields */}
        {/* Fix: casting handles the type inference of entries in filtering and mapping */}
        {extraEntries.filter(([_, v]) => v.length >= 15).length > 0 && (
          <div className="space-y-2 pt-1">
             {extraEntries.filter(([_, v]) => v.length >= 15).map(([k, v]) => (
               <div key={k} className="text-[11px] leading-snug">
                 <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">{k}:</span>
                 <span className="text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 block">{v}</span>
               </div>
             ))}
          </div>
        )}

        {/* Remarks / Message */}
        {data.message && (
          <div className="bg-orange-50/20 p-3 rounded-lg border-l-4 border-orange-200">
             <div className="flex items-center gap-1.5 mb-1">
               <Info size={12} className="text-orange-400" />
               <span className="text-[9px] font-black uppercase text-orange-400 tracking-wider">Remarks</span>
             </div>
             <p className="text-sm text-slate-700 italic line-clamp-4 leading-relaxed">"{data.message}"</p>
          </div>
        )}

        {/* Media Section */}
        {hasMedia && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2 px-1">
               <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Media Gallery</span>
               <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{allMedia.length} Items</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {displayMedia.map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => onMediaClick(allMedia, idx)}
                  className={`group relative aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-orange-400 transition-all shadow-sm ${
                    item.type === 'video' ? 'bg-slate-900' : 'bg-slate-100'
                  }`}
                  aria-label={`View ${item.type}`}
                >
                  {item.type === 'image' ? (
                    <img 
                      src={item.url} 
                      alt={`Thumbnail ${idx + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      loading="lazy" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                       <Play className="text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" size={18} fill="currentColor" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                </button>
              ))}
              
              {remainingCount > 0 && (
                 <button 
                   onClick={() => onMediaClick(allMedia, 4)}
                   className="aspect-square bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white hover:bg-orange-600 border border-slate-200 transition-colors"
                 >
                   <span className="text-xs font-black">+{remainingCount}</span>
                 </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
