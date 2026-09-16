import React from 'react';

interface QuickSearchWidgetProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch?: () => void;
}

export default function QuickSearchWidget({
  searchTerm,
  setSearchTerm,
  onSearch,
}: QuickSearchWidgetProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  return (
    <div className="w-full relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tìm kiếm văn bản đến/đi theo số ký hiệu hoặc trích yếu..."
        className="w-full pl-4 pr-10 py-2 rounded-sm border border-[#0a3871]/40 bg-surface text-main text-xs sm:text-sm focus:outline-none focus:border-[#0a3871] focus:ring-1 focus:ring-[#0a3871] transition-all shadow-xs placeholder:text-muted"
      />
      <button
        type="button"
        onClick={onSearch}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-[#0a3871] transition-colors cursor-pointer p-1"
        title="Tìm kiếm"
      >
        <i className="fa-solid fa-magnifying-glass text-sm" />
      </button>
    </div>
  );
}


