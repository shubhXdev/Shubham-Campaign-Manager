import React from 'react';
import { CampaignResponse, MediaItem } from '../types';
import { MapPin, Calendar, Users, FileText, Play, Info, Tag, Images } from 'lucide-react';

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
  
  // Identify extra fields to display
  const extraEntries = Object.entries(data.extraFields || {}) as [string, string][];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full card-break-inside-avoid">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-start">
        <div className="flex-grow min-w-0">
          <h3 className="font-bold text-slate-900 truncate leading-tight" title={data.name}>
            {data.name}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
            <Calendar size={10} className="text-orange-400" />
            {data.dateOfDrive}
          </p>
        </div>
        <div className={`shrink-0 ml-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
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

        {/* Metrics Grid */}
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
          {extraEntries.filter(([_, v]) => v.length < 15).slice(0, 2).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <Tag size={12} className="text-slate-400" />
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] uppercase font-bold text-slate-400 truncate block" title={k}>{k}</span>
                <span className="text-xs font-bold text-slate-700 truncate block">{v}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Dynamic Detail List for longer extra fields */}
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

        {/* Media Sliding View */}
        {hasMedia && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2 px-1">
               <div className="flex items-center gap-1.5">
                 <Images size={12} className="text-slate-400" />
                 <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Media Gallery</span>
               </div>
               <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{allMedia.length} {allMedia.length === 1 ? 'Item' : 'Items'}</span>
            </div>
            
            {/* The Slider Container */}
            <div className="relative group">
              <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {allMedia.map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => onMediaClick(allMedia, idx)}
                    className={`shrink-0 w-32 aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-orange-400 transition-all shadow-sm snap-start relative group/item ${
                      item.type === 'video' ? 'bg-slate-900' : 'bg-slate-100'
                    }`}
                    aria-label={`View ${item.type} ${idx + 1}`}
                  >
                    {item.type === 'image' ? (
                      <img 
                        src={item.url} 
                        alt={`Thumbnail ${idx + 1}`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110" 
                        loading="lazy" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800">
                         <Play className="text-white opacity-80 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all" size={24} fill="currentColor" />
                         <span className="absolute bottom-1 right-1.5 text-[8px] font-black text-white/50 uppercase">Video</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-all" />
                  </button>
                ))}
              </div>
              
              {/* Fade indicators for scrolling */}
              <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none rounded-r-xl" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
