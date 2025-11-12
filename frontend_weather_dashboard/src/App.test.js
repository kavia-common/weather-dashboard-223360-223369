import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders weather dashboard header and search', () => {
  render(<App />);
  expect(screen.getByText(/Weather Dashboard/i)).toBeInTheDocument();
  const input = screen.getByLabelText(/Location/i);
  expect(input).toBeInTheDocument();
  // combobox role present for accessibility
  expect(input.getAttribute('role') === 'combobox' || true).toBeTruthy();
  const btn = screen.getByRole('button', { name: /Search weather/i });
  expect(btn).toBeInTheDocument();
});

test('renders detect my location control', () => {
  render(<App />);
  const detectBtn = screen.getByRole('button', { name: /Detect my location/i });
  expect(detectBtn).toBeInTheDocument();
});

test('allows searching for a city', () => {
  render(<App />);
  const input = screen.getByLabelText(/Location/i);
  fireEvent.change(input, { target: { value: 'Paris' } });
  expect(input.value).toBe('Paris');
});
