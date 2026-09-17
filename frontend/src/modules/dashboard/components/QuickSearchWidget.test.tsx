import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuickSearchWidget from './QuickSearchWidget';

describe('QuickSearchWidget Component', () => {
  it('renders input with correct placeholder and search icon', () => {
    render(
      <MemoryRouter>
        <QuickSearchWidget />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Tìm kiếm văn bản đến/đi theo số ký hiệu hoặc trích yếu...');
    expect(input).toBeDefined();

    const searchBtn = screen.getByRole('button', { name: /tìm kiếm văn bản/i });
    expect(searchBtn).toBeDefined();
  });

  it('triggers onSearch callback with input value on Enter key', () => {
    const handleSearch = vi.fn();
    render(
      <MemoryRouter>
        <QuickSearchWidget onSearch={handleSearch} />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Tìm kiếm văn bản đến/đi theo số ký hiệu hoặc trích yếu...');
    fireEvent.change(input, { target: { value: '128/QĐ-BGDĐT' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleSearch).toHaveBeenCalledWith('128/QĐ-BGDĐT');
  });

  it('triggers onSearch callback when clicking the search button', () => {
    const handleSearch = vi.fn();
    render(
      <MemoryRouter>
        <QuickSearchWidget onSearch={handleSearch} />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Tìm kiếm văn bản đến/đi theo số ký hiệu hoặc trích yếu...');
    fireEvent.change(input, { target: { value: 'Công văn 45' } });

    const searchBtn = screen.getByRole('button', { name: /tìm kiếm văn bản/i });
    fireEvent.click(searchBtn);

    expect(handleSearch).toHaveBeenCalledWith('Công văn 45');
  });
});
