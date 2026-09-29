import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import BirthdaysWidget from './BirthdaysWidget';

describe('BirthdaysWidget', () => {
  it('renders nothing when the dashboard API omits birthday data', () => {
    const { container } = render(<BirthdaysWidget />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders staff supplied by the dashboard API', () => {
    render(<BirthdaysWidget birthdays={[
      { id: 101, name: 'Nguyễn Văn Minh', birthdate: '24/09', position: 'Chuyên viên', department: 'Văn phòng' },
    ]} />);
    expect(screen.getAllByText('Nguyễn Văn Minh')).toHaveLength(2);
  });
});
