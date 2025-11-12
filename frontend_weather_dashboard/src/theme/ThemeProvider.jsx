import React, { useEffect } from 'react';

/**
 * PUBLIC_INTERFACE
 * ThemeProvider applies the Ocean Professional theme and sets up meta styling.
 */
export function ThemeProvider({ children, themeMode = 'light' }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    document.body.style.background = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-bg');
    document.title = 'Weather Dashboard';
  }, [themeMode]);

  return <>{children}</>;
}

export default ThemeProvider;
