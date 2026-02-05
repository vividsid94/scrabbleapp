/**
 * Centralized theme color utility.
 * Replaces hundreds of inline `lightMode === 'dark' ? X : Y` ternaries.
 */
export function getThemeColors(lightMode) {
  const dark = lightMode === 'dark';
  return {
    // Backgrounds
    pageBg: dark ? '#111827' : '#f9fafb',
    cardBg: dark ? '#1F2937' : '#fff',
    cardBgHover: dark ? '#374151' : '#f3f4f6',
    inputBg: dark ? '#374151' : '#fff',
    badgeBg: dark ? '#1F2937' : '#f3f4f6',
    headerBg: dark ? '#1F2937' : '#f9fafb',
    rowBg: dark ? '#374151' : '#f9fafb',
    rowBgAlt: dark ? '#1F2937' : '#fff',

    // Text
    textPrimary: dark ? '#fff' : '#1F2937',
    textSecondary: dark ? '#9ca3af' : '#6b7280',
    textMuted: dark ? '#6b7280' : '#9ca3af',
    textInverse: dark ? '#1F2937' : '#fff',

    // Borders
    border: dark ? '#374151' : '#e5e7eb',
    borderLight: dark ? '#4b5563' : '#d1d5db',
    borderHover: dark ? '#6b7280' : '#9ca3af',

    // Accents
    accentBlue: dark ? '#60a5fa' : '#3b82f6',
    accentBlueBg: dark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
    accentGreen: dark ? '#10b981' : '#059669',
    accentGreenBg: dark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.08)',
    accentRed: dark ? '#ef4444' : '#dc2626',
    accentRedBg: dark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.08)',
    accentGold: dark ? '#f59e0b' : '#d97706',
    accentGoldBg: dark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.08)',
    accentSilver: dark ? '#9ca3af' : '#6b7280',
    accentBronze: dark ? '#d97706' : '#92400e',

    // Errors
    errorBg: dark ? '#7f1d1d' : '#fee2e2',
    errorText: dark ? '#fca5a5' : '#991b1b',

    // Shadows
    shadow: dark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
    shadowHover: dark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.15)',

    // Specific
    tabActive: dark ? '#3b82f6' : '#60a5fa',
    tabInactive: 'transparent',
    tabText: dark ? '#9ca3af' : '#6b7280',
    tabActiveText: '#fff',

    // Spread/rating change
    positive: dark ? '#10b981' : '#059669',
    negative: dark ? '#ef4444' : '#dc2626',
  };
}
