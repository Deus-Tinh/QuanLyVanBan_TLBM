import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardStats from './DashboardStats';

describe('DashboardStats Component', () => {
  it('renders default KPI values correctly', () => {
    render(<DashboardStats />);
    expect(screen.getByText('1,248')).toBeInTheDocument();
    expect(screen.getByText('856')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('renders custom KPI values when provided', () => {
    render(
      <DashboardStats
        incomingCount={999}
        outgoingCount={333}
        confidentialCount={12}
        tasksCount={5}
      />
    );
    expect(screen.getByText('999')).toBeInTheDocument();
    expect(screen.getByText('333')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
