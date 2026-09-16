import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardStats from './DashboardStats';

describe('DashboardStats Component', () => {
  it('renders default KPI values correctly', () => {
    render(
      <MemoryRouter>
        <DashboardStats />
      </MemoryRouter>
    );
    expect(screen.getByText('1,248')).toBeInTheDocument();
    expect(screen.getByText('856')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('renders custom KPI values when provided', () => {
    render(
      <MemoryRouter>
        <DashboardStats
          incomingCount={999}
          outgoingCount={333}
          confidentialCount={12}
          tasksCount={5}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('999')).toBeInTheDocument();
    expect(screen.getByText('333')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

