import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface QuickSearchWidgetProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  onSearch?: (term?: string) => void;
}

export default function QuickSearchWidget({
  searchTerm: externalSearchTerm,
  setSearchTerm: externalSetSearchTerm,
  onSearch,
}: QuickSearchWidgetProps) {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const navigate = useNavigate();

  const isControlled = externalSearchTerm !== undefined;
  const currentSearchTerm = isControlled ? externalSearchTerm : internalSearchTerm;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (externalSetSearchTerm) {
      externalSetSearchTerm(val);
    }
    if (!isControlled) {
      setInternalSearchTerm(val);
    }
  };

  const handleSearchSubmit = () => {
    if (onSearch) {
      onSearch(currentSearchTerm);
    } else if (currentSearchTerm.trim()) {
      navigate(`/documents/incoming?q=${encodeURIComponent(currentSearchTerm.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  return (
    <div className="w-full relative">
      <input
        type="text"
        value={currentSearchTerm}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Tìm kiếm văn bản đến/đi theo số ký hiệu hoặc trích yếu..."
        className="w-full pl-4 pr-10 py-2 rounded-sm border border-border-subtle bg-surface text-main text-xs sm:text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-xs placeholder:text-muted"
      />
      <button
        type="button"
        onClick={handleSearchSubmit}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors cursor-pointer p-1"
        title="Tìm kiếm"
        aria-label="Tìm kiếm văn bản"
      >
        <i className="fa-solid fa-magnifying-glass text-sm" />
      </button>
    </div>
  );
}



