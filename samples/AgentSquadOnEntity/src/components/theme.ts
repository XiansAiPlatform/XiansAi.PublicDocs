import type { StepThemeColors } from './types';

// Utility function to derive all colors from theme name
export const getThemeColors = (themeName: string): StepThemeColors => {
  // Extract the base theme name (remove bg- prefix if present)
  const baseTheme = themeName.replace('bg-', '');
  
  // Dynamically generate Tailwind classes based on theme name
  return {
    bg: `bg-${baseTheme}-600`,
    bgLight: `bg-${baseTheme}-50`,
    bgDark: `bg-${baseTheme}-800`,
    text: `text-${baseTheme}-900`,
    border: `border-${baseTheme}-200`,
    buttonPrimary: `bg-${baseTheme}-600`,
    buttonPrimaryHover: `hover:bg-${baseTheme}-700`,
    buttonPrimaryFocus: `focus:ring-${baseTheme}-500`,
    buttonSecondary: `bg-${baseTheme}-50`,
    buttonSecondaryHover: `hover:bg-${baseTheme}-100`,
    buttonSecondaryBorder: `border-${baseTheme}-200`
  };
}; 