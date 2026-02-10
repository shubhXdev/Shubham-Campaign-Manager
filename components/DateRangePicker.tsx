import React from 'react';
import { DateRange } from '../types';
import { Calendar, X } from 'lucide-react';

interface Props {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
  onClear: () => void;
}

export const DateRangePicker: React.FC<Props> = ({ dateRange, onChange, onClear }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 px-2">
        <Calendar size={18} />
        <span className="text-sm font-medium">Filter by Date:</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => onChange({ ...dateRange, startDate: e.target.value })}
          className="px-2 py-1 text-sm border rounded hover:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700"
        />
        <span className="text-slate-400">-</span>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => onChange({ ...dateRange, endDate: e.target.value })}
          className="px-2 py-1 text-sm border rounded hover:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700"
        />
      </div>
      {(dateRange.startDate || dateRange.endDate) && (
        <button 
          onClick={onClear}
          className="ml-auto sm:ml-0 p-1 text-slate-400 hover:text-red-500 transition-colors"
          title="Clear date filter"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
