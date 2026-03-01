import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Search, Check } from 'lucide-react';

interface CreatableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  required?: boolean;
}

const CreatableSelect: React.FC<CreatableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  icon,
  className = '',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync value with searchTerm when value changes externally (e.g. edit mode)
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Filter options based on search
  useEffect(() => {
    const filtered = options.filter(opt => 
      opt.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If the user typed something but didn't select, keep it (act as text input)
        // This ensures the "create" happens implicitly on blur if they don't click the button
        if (value !== searchTerm) {
            onChange(searchTerm);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, searchTerm, value, onChange]);

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm(option);
    setIsOpen(false);
  };

  const handleCreate = () => {
    onChange(searchTerm);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-2 relative ${className}`} ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-300 md:text-xs md:font-bold md:uppercase md:text-gray-500">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
          {icon || <Search size={18} />}
        </div>
        <input
          type="text"
          required={required}
          value={searchTerm}
          onClick={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value); // Update parent immediately for text input feel
            if (!isOpen) setIsOpen(true);
          }}
          className="block w-full rounded-xl border border-white/10 bg-[#0c0c1a] py-3.5 pl-12 pr-10 text-white shadow-sm placeholder:text-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all truncate"
          placeholder={placeholder || 'Seleccionar o escribir...'}
          autoComplete="off"
        />
        <div 
          className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-gray-500 hover:text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-white/10 rounded-xl shadow-xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
          
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(option)}
                className="px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer flex items-center justify-between group"
              >
                <span>{option}</span>
                {value === option && <Check size={14} className="text-primary" />}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 italic">
              No hay coincidencias
            </div>
          )}

          {/* Create Option */}
          {searchTerm && !filteredOptions.includes(searchTerm) && (
            <div
              onClick={handleCreate}
              className="px-4 py-3 text-sm text-primary font-bold bg-primary/10 hover:bg-primary/20 cursor-pointer border-t border-white/5 flex items-center gap-2"
            >
              <Plus size={14} />
              <span>Añadir "{searchTerm}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatableSelect;