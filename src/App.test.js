import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the CoogMusic logo', () => {
  render(<App />);
  const logoElement = screen.getByAltText(/CoogMusic Logo/i);
  expect(logoElement).toBeInTheDocument();
});
