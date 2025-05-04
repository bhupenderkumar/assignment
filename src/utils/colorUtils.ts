// src/utils/colorUtils.ts

/**
 * Converts a hex color code to an rgba color string
 * @param hex The hex color code (with or without #)
 * @param alpha The alpha value (0-1)
 * @returns An rgba color string
 */
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  try {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (error) {
    console.error('Invalid hex color:', hex);
    return `rgba(0, 0, 0, ${alpha})`;
  }
};

/**
 * Converts a hex color code to an rgb object
 * @param hex The hex color code (with or without #)
 * @returns An object with r, g, b properties
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  try {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return { r, g, b };
  } catch (error) {
    console.error('Invalid hex color:', hex);
    return { r: 0, g: 0, b: 0 };
  }
};

/**
 * Converts a hex color code to an rgb color string
 * @param hex The hex color code (with or without #)
 * @returns An rgb color string
 */
export const hexToRgbString = (hex: string): string => {
  const { r, g, b } = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
};
