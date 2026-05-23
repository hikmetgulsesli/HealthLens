// HealthLens Dark Theme — Based on Stitch Design System
// Deep navy-charcoal with teal accent

export const colors = {
  // === Core Backgrounds ===
  background: '#0F172A',
  surface: '#1E293B',
  surfaceDim: '#0F172A',
  surfaceBright: '#334155',
  surfaceContainerLowest: '#020617',
  surfaceContainerLow: '#1E293B',
  surfaceContainer: '#334155',
  surfaceContainerHigh: '#475569',
  surfaceContainerHighest: '#64748B',

  // === Text Colors ===
  onSurface: '#F1F5F9',
  onSurfaceVariant: '#94A3B8',
  inverseSurface: '#F1F5F9',
  inverseOnSurface: '#1E293B',

  // === Borders & Dividers ===
  outline: 'rgba(148, 163, 184, 0.15)',
  outlineVariant: 'rgba(148, 163, 184, 0.1)',

  // === Primary Accent (Teal) ===
  primary: '#14B8A6',
  onPrimary: '#FFFFFF',
  primaryContainer: '#0D9488',
  onPrimaryContainer: '#F0FDFA',
  primaryLight: '#5EEAD4',
  primaryFixed: '#14B8A6',
  primaryFixedDim: '#0D9488',
  onPrimaryFixed: '#FFFFFF',
  onPrimaryFixedVariant: '#F0FDFA',

  // === Secondary ===
  secondary: '#5EEAD4',
  onSecondary: '#0F172A',
  secondaryContainer: '#134E4A',
  onSecondaryContainer: '#CCFBF1',

  // === Tertiary (Orange for Fat) ===
  tertiary: '#FB923C',
  onTertiary: '#0F172A',
  tertiaryContainer: '#7C2D12',
  onTertiaryContainer: '#FFEDD5',

  // === Semantic Colors ===
  error: '#EF4444',
  onError: '#FFFFFF',
  errorContainer: '#7F1D1D',
  onErrorContainer: '#FEE2E2',
  success: '#22C55E',
  warning: '#F59E0B',

  // === Surface Tint ===
  surfaceTint: '#14B8A6',
  surfaceVariant: '#334155',

  // === Legacy Dashboard Colors (for backward compatibility) ===
  dashboardBackground: '#0F172A',
  dashboardSurface: '#1E293B',
  dashboardSurfaceDim: '#0F172A',
  dashboardSurfaceBright: '#334155',
  dashboardSurfaceContainerLowest: '#020617',
  dashboardSurfaceContainerLow: '#1E293B',
  dashboardSurfaceContainer: '#334155',
  dashboardSurfaceContainerHigh: '#475569',
  dashboardSurfaceContainerHighest: '#64748B',
  dashboardOnSurface: '#F1F5F9',
  dashboardOnSurfaceVariant: '#94A3B8',
  dashboardOutline: 'rgba(148, 163, 184, 0.15)',
  dashboardOutlineVariant: 'rgba(148, 163, 184, 0.1)',
  dashboardPrimary: '#14B8A6',
  dashboardOnPrimary: '#FFFFFF',
  dashboardPrimaryContainer: '#0D9488',
  dashboardOnPrimaryContainer: '#F0FDFA',
  dashboardSecondary: '#5EEAD4',
  dashboardOnSecondary: '#0F172A',
  dashboardSecondaryContainer: '#134E4A',
  dashboardOnSecondaryContainer: '#CCFBF1',
  dashboardTertiary: '#FB923C',
  dashboardOnTertiary: '#0F172A',
  dashboardTertiaryContainer: '#7C2D12',
  dashboardOnTertiaryContainer: '#FFEDD5',
  dashboardSurfaceVariant: '#334155',
} as const;

export const withAlpha = (hex: string, alpha: number): string => {
  if (hex.startsWith('rgba')) {
    return hex.replace(/[\)]/g, '').replace(/[^,]+$/g, `${alpha})`);
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
