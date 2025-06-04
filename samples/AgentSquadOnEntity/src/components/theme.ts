import type { StepThemeColors } from './types';

// Define the available theme names from the Tailwind config
export type ThemeName = 'purple' | 'warm' | 'lavender' | 'cream' | 'blue' | 'error' | 'warning' | 'info' | 'red' | 'yellow' | 'neutral';

// Utility function to derive all colors from theme name
export const getThemeColors = (themeName: ThemeName): StepThemeColors => {
  // Extract the base theme name (remove bg- prefix if present)
  const baseTheme = themeName.replace('bg-', '') as ThemeName;
  
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

// Helper function to get semantic theme colors
export const getSemanticThemeColors = () => ({
  primary: getThemeColors('purple'),   // Using your custom purple as primary
  success: getThemeColors('blue'),     // Using your custom blue for success
  error: getThemeColors('error'),      // Using your semantic error colors
  warning: getThemeColors('warning'),  // Using your semantic warning colors
  info: getThemeColors('info'),        // Using your semantic info colors
  neutral: getThemeColors('neutral'),  // Using your neutral colors
});

// Predefined theme variations for easy access
export const themeVariants = {
  purple: getThemeColors('purple'),
  warm: getThemeColors('warm'),
  lavender: getThemeColors('lavender'),
  cream: getThemeColors('cream'),
  blue: getThemeColors('blue'),
  error: getThemeColors('error'),
  warning: getThemeColors('warning'),
  info: getThemeColors('info'),
  red: getThemeColors('red'),
  yellow: getThemeColors('yellow'),
  neutral: getThemeColors('neutral'),
}; 