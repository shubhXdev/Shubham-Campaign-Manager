import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../types';

interface Props {
  item: MediaItem;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const MediaPreview: React.FC<Props> = ({ item, onClose, onNext, onPrev }) => {
  const { url, type } = item;
  // Check if it's a drive preview link (usually for videos)
  const isDriveEmbed = url.includes('drive.google.com') && url.includes('preview');

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight' && onNext) onNext();
    if (e.key === 'ArrowLeft' && onPrev) onPrev();
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Controls - Top Right */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-50 p-2 rounded-full hover:bg-white/10"
      >
        <X size={28} />
      </button>

      {/* Navigation - Left */}
      {onPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-50 p-3 rounded-full hover:bg-white/10"
          aria-label="Previous image"
        >
          <ChevronLeft size={40} />
        </button>
      )}

      {/* Navigation - Right */}
      {onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-50 p-3 rounded-full hover:bg-white/10"
          aria-label="Next image"
        >
          <ChevronRight size={40} />
        </button>
      )}
      
      {/* Content Area */}
      <div className="max-w-7xl max-h-[90vh] w-full flex items-center justify-center overflow-hidden relative px-12 sm:px-20">
        {type === 'image' ? (
          <img 
            src={url} 
            alt="Full preview" 
            className="max-w-full max-h-[85vh] object-contain shadow-xl"
            onError={(e) => {
              // Fallback for broken images (common with drive permissions)
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<div class="text-white p-8 text-center"><p>Image not accessible.</p><p class="text-sm text-gray-400 mt-2">Ensure the Google Drive file is shared publicly.</p></div>';
            }}
          />
        ) : (
          isDriveEmbed ? (
            <iframe 
              src={url}
              className="w-full max-w-4xl h-[80vh] border-0 shadow-xl"
              allow="autoplay"
              title="Video Preview"
            ></iframe>
          ) : (
            <video 
              src={url} 
              controls 
              autoPlay 
              className="max-w-full max-h-[85vh] outline-none shadow-xl"
            />
          )
        )}
      </div>
    </div>
  );
};