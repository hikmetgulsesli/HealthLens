// Generated from Stitch HTML files — DO NOT EDIT MANUALLY
// Stitch names mapped to JS-safe camelCase; hex values are exact from design system

export const colors = {
  surface: '#0b1326',
  surfaceDim: '#0b1326',
  surfaceBright: '#31394d',
  surfaceContainerLowest: '#060e20',
  surfaceContainerLow: '#131b2e',
  surfaceContainer: '#171f33',
  surfaceContainerHigh: '#222a3d',
  surfaceContainerHighest: '#2d3449',
  onSurface: '#dae2fd',
  onSurfaceVariant: '#bec8ca',
  inverseSurface: '#dae2fd',
  inverseOnSurface: '#283044',
  outline: '#889394',
  outlineVariant: '#3e494a',
  surfaceTint: '#82d3de',
  primary: '#82d3de',
  onPrimary: '#00363c',
  primaryContainer: '#006d77',
  onPrimaryContainer: '#9becf7',
  inversePrimary: '#006972',
  secondary: '#b9c7df',
  onSecondary: '#233144',
  secondaryContainer: '#3c4a5e',
  onSecondaryContainer: '#abb9d1',
  tertiary: '#accec5',
  onTertiary: '#163630',
  tertiaryContainer: '#496861',
  onTertiaryContainer: '#c3e6dd',
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  primaryFixed: '#9ff0fb',
  primaryFixedDim: '#82d3de',
  onPrimaryFixed: '#001f23',
  onPrimaryFixedVariant: '#004f56',
  secondaryFixed: '#d5e3fc',
  secondaryFixedDim: '#b9c7df',
  onSecondaryFixed: '#0d1c2e',
  onSecondaryFixedVariant: '#3a485b',
  tertiaryFixed: '#c7eae1',
  tertiaryFixedDim: '#accec5',
  onTertiaryFixed: '#00201b',
  onTertiaryFixedVariant: '#2d4c46',
  background: '#0b1326',
  onBackground: '#dae2fd',
  surfaceVariant: '#2d3449',
} as const;

export const withAlpha = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
