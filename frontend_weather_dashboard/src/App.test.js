import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders weather dashboard header and search', () => {
  render(<App />);
  expect(screen.getByText(/Weather Dashboard/i)).toBeInTheDocument();
  const input = screen.getByLabelText(/Location/i);
  expect(input).toBeInTheDocument();
  const btn = screen.getByRole('button', { name: /Search weather/i });
  expect(btn).toBeInTheDocument();
});

test('allows searching for a city', () => {
  render(<App />);
  const input = screen.getByLabelText(/Location/i);
  fireEvent.change(input, { target: { value: 'Paris' } });
  expect(input.value).toBe('Paris');
});
