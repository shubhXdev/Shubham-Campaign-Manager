import React from 'react';
import { CampaignResponse, MediaItem } from '../types';
import { MapPin, Calendar, Users, FileText, Play } from 'lucide-react';

interface Props {
  data: CampaignResponse;
  onMediaClick: (items: MediaItem[], index: number) => void;
}

export const ResponseCard: React.FC<Props> = ({ data, onMediaClick }) => {
  // Combine photos and videos into a single uniform list
  const allMedia: MediaItem[] = [
    ...data.photoUrls.map(url => ({ url, type: 'image' as const })),
    ...data.videoUrls.map(url => ({ url, type: 'video' as const }))
  ];

  const hasMedia = allMedia.length > 0;
  // Show up to 4 media items in the grid
  const displayMedia = allMedia.slice(0, 4);
  const remainingCount = allMedia.length - 4;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full card-break-inside-avoid">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-slate-900 line-clamp-1" title={data.name}>{data.name}</h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <Calendar size={12} />
            {data.dateOfDrive}
          </p>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          data.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
          data.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {data.sentiment}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow space-y-3">
        {/* Location */}
        <div className="flex items-start gap-2 text-slate-600 text-xs">
          <MapPin size={14} className="mt-0.5 shrink-0 text-orange-500" />
          <span className="font-medium line-clamp-1" title={data.location}>{data.location}</span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
          {data.staffInvolved && (
            <div className="flex items-center gap-1.5" title="Staff Involved">
              <Users size={14} className="text-indigo-500" />
              <span>{data.staffInvolved}</span>
            </div>
          )}
          {data.pamphletsUsed && (
            <div className="flex items-center gap-1.5" title="Pamphlets Used">
              <FileText size={14} className="text-emerald-500" />
              <span>{data.pamphletsUsed}</span>
            </div>
          )}
        </div>
        
        {/* Message */}
        {data.message && (
          <div className="text-sm text-slate-700 italic relative pl-3 border-l-2 border-slate-200">
             <p className="line-clamp-3">"{data.message}"</p>
          </div>
        )}

        {/* Media Grid */}
        {hasMedia && (
          <div className="mt-3 pt-2 border-t border-slate-50">
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
                      alt={`Media thumbnail ${idx + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      loading="lazy" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                       <Play className="text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" size={20} fill="currentColor" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                </button>
              ))}
              
              {remainingCount > 0 && (
                 <button 
                   onClick={() => onMediaClick(allMedia, 4)} // Index 4 is the start of remaining items
                   className="aspect-square bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-orange-600 border border-slate-200 transition-colors"
                 >
                   <span className="text-xs font-bold">+{remainingCount}</span>
                 </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};