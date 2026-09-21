import { useState, useRef, useEffect } from 'react';
import { skills } from '../utils/skills';

const SkillSelector = ({ selectedSkills = [], onAdd, onRemove }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedSearch = search.trim().toLowerCase();

  // Filter predefined skills (with case-insensitive duplicate check)
  const filtered = skills.filter(s => 
    s.toLowerCase().includes(normalizedSearch) && 
    !selectedSkills.some(sel => sel.toLowerCase() === s.toLowerCase())
  ).slice(0, 8);

  const isInPredefinedList = skills.some(s => s.toLowerCase() === normalizedSearch);
  const isAlreadySelected = selectedSkills.some(s => s.toLowerCase() === normalizedSearch);

  const handleAddCustom = () => {
    const s = search.trim();
    if (!s || isAlreadySelected) return;
    
    onAdd(s);
    setSearch('');
    setIsOpen(false); // Explicitly close dropdown
  };

  const handleSelectFromList = (s) => {
    onAdd(s);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      {/* Selected Skills Chips */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedSkills.map(skill => (
          <span key={skill} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            {skill}
            <button 
              type="button" 
              onClick={() => onRemove(skill)} 
              className="text-blue-500 hover:text-blue-800 dark:hover:text-blue-100 font-bold ml-1"
              aria-label={`Remove ${skill}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search skills or add custom..." 
          className="input-field"
          value={search} 
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustom(); } }}
        />
        
        {/* Dropdown */}
        {isOpen && search.trim() && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
            {filtered.map(s => (
              <div 
                key={s} 
                className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-gray-200"
                onClick={() => handleSelectFromList(s)}
              >
                {s}
              </div>
            ))}
            
            {/* Custom Skill Option */}
            {search.trim() && !isInPredefinedList && !isAlreadySelected && (
              <div 
                className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-blue-600 dark:text-blue-400 font-medium border-t border-gray-100 dark:border-gray-700" 
                onClick={handleAddCustom}
              >
                + Add "{search.trim()}"
              </div>
            )}

            {/* Feedback if they type an exact match of an already selected skill */}
            {search.trim() && isAlreadySelected && (
               <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm italic">
                 Already selected
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillSelector;