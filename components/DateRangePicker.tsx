import React from 'react';
import { DateRange } from '../types';
import { Calendar, X, Clock } from 'lucide-react';

interface Props {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
  onClear: () => void;
}

export const DateRangePicker: React.FC<Props> = ({ dateRange, onChange, onClear }) => {
  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    if (days === 0) {
      // Today
    } else if (days === 1) {
      // Yesterday
      start.setDate(end.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else {
      start.setDate(end.getDate() - days);
    }
    
    onChange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 px-2 border-r border-slate-100 pr-3 mr-1 hidden sm:flex">
        <Calendar size={18} />
      </div>
      
      {/* Date Inputs */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => onChange({ ...dateRange, startDate: e.target.value })}
          className="px-2 py-1 text-sm border border-slate-200 rounded hover:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 bg-slate-50/50"
        />
        <span className="text-slate-400 text-xs">to</span>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => onChange({ ...dateRange, endDate: e.target.value })}
          className="px-2 py-1 text-sm border border-slate-200 rounded hover:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 bg-slate-50/50"
        />
      </div>

      {/* Presets */}
      <div className="flex items-center gap-1 ml-1">
        <button 
          onClick={() => setPreset(0)}
          className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-orange-100 hover:text-orange-700 transition-colors"
          title="Today"
        >
          Today
        </button>
        <button 
          onClick={() => setPreset(7)}
          className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-orange-100 hover:text-orange-700 transition-colors hidden sm:block"
          title="Last 7 Days"
        >
          7d
        </button>
      </div>

      {(dateRange.startDate || dateRange.endDate) && (
        <button 
          onClick={onClear}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-1"
          title="Clear date filter"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
