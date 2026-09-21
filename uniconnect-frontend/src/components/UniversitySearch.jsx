import { useState, useRef, useEffect, useMemo } from 'react';
import { universities as RAW } from '../utils/universities';

// Strip trailing whitespace from the data file ONCE at load time
const universities = RAW.map((u) => ({
  ...u,
  name: String(u.name || '').trim(),
  campuses: (u.campuses || []).map((c) => String(c).trim()).filter(Boolean),
}));

const UniversitySearch = ({ value, onChange, campusValue, onCampusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const safeValue = String(value || '').trim();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Issue #3 fix: case-insensitive match so trimmed DB values still find the uni
  const selectedUni = useMemo(
    () => universities.find((u) => u.name.toLowerCase() === safeValue.toLowerCase()) || null,
    [safeValue]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? universities.filter((u) => u.name.toLowerCase().includes(q)) : universities;
  }, [search]);

  const selectUniversity = (uni) => {
    // Issue #1 fix: always emit the CLEAN trimmed name
    onChange?.(uni.name);
    onCampusChange?.(uni.campuses.length === 1 ? uni.campuses[0] : '');
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search your university..."
          className="input-field"
          style={{ paddingLeft: '2.5rem', paddingRight: '3.5rem' }}
          value={isOpen ? search : safeValue}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => { setSearch(''); setIsOpen(true); }}
          autoComplete="off"
        />
        {safeValue && !isOpen && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <span className="text-green-600 text-xs font-bold">✓</span>
            <button type="button" title="Clear" onClick={() => { onChange?.(''); onCampusChange?.(''); }} className="text-slate-400 hover:text-red-500 text-sm font-bold">✕</button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl max-h-52 overflow-y-auto">
          {filtered.length ? filtered.map((u) => (
            <button
              type="button"
              key={u.code}
              onClick={() => selectUniversity(u)}
              className={`w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 ${u.name === safeValue ? 'bg-blue-50 dark:bg-slate-700 font-semibold text-blue-700 dark:text-blue-300' : ''}`}
            >
              {u.name}
            </button>
          )) : <p className="px-3 py-2 text-sm text-slate-500">No universities found</p>}
        </div>
      )}

      {selectedUni && selectedUni.campuses.length > 0 && (
        <select
          className="input-field mt-2"
          value={campusValue || ''}
          onChange={(e) => onCampusChange?.(e.target.value)}
          required
        >
          <option value="">Select Campus *</option>
          {selectedUni.campuses.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
    </div>
  );
};

export default UniversitySearch;