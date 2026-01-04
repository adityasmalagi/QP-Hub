import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

type FontSize = 'small' | 'normal' | 'large';
type AccentColor = 'purple' | 'blue' | 'green' | 'orange' | 'pink';

interface AccessibilitySettings {
  fontSize: FontSize;
  accentColor: AccentColor;
}

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  setFontSize: (size: FontSize) => void;
  setAccentColor: (color: AccentColor) => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 'normal',
  accentColor: 'purple',
};

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

const STORAGE_KEY = 'accessibility-settings';

// Font size multipliers (applied to root html element)
const fontSizeMap: Record<FontSize, { mobile: number; desktop: number }> = {
  small: { mobile: 13, desktop: 15 },
  normal: { mobile: 14, desktop: 16 },
  large: { mobile: 16, desktop: 18 },
};

// Accent color HSL values
const accentColorMap: Record<AccentColor, { primary: string; primaryForeground: string; ring: string }> = {
  purple: { primary: '246 80% 60%', primaryForeground: '0 0% 100%', ring: '246 80% 60%' },
  blue: { primary: '217 91% 60%', primaryForeground: '0 0% 100%', ring: '217 91% 60%' },
  green: { primary: '142 76% 45%', primaryForeground: '0 0% 100%', ring: '142 76% 45%' },
  orange: { primary: '25 95% 53%', primaryForeground: '0 0% 100%', ring: '25 95% 53%' },
  pink: { primary: '330 80% 60%', primaryForeground: '0 0% 100%', ring: '330 80% 60%' },
};

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Apply font size to document
  useEffect(() => {
    const { mobile, desktop } = fontSizeMap[settings.fontSize];
    
    // Create or update style element for responsive font sizing
    let styleEl = document.getElementById('accessibility-font-size');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'accessibility-font-size';
      document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = `
      html { font-size: ${mobile}px; }
      @media (min-width: 768px) { html { font-size: ${desktop}px; } }
    `;
  }, [settings.fontSize]);

  // Apply accent color to document
  useEffect(() => {
    const colors = accentColorMap[settings.accentColor];
    const root = document.documentElement;
    
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--ring', colors.ring);
    
    // Also update secondary to match accent theme
    const secondaryMap: Record<AccentColor, string> = {
      purple: '245 100% 95%',
      blue: '214 100% 95%',
      green: '142 100% 95%',
      orange: '25 100% 95%',
      pink: '330 100% 95%',
    };
    const secondaryFgMap: Record<AccentColor, string> = {
      purple: '246 80% 45%',
      blue: '217 91% 45%',
      green: '142 76% 35%',
      orange: '25 95% 40%',
      pink: '330 80% 45%',
    };
    
    root.style.setProperty('--secondary', secondaryMap[settings.accentColor]);
    root.style.setProperty('--secondary-foreground', secondaryFgMap[settings.accentColor]);
  }, [settings.accentColor]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setFontSize = (fontSize: FontSize) => {
    setSettings(prev => ({ ...prev, fontSize }));
  };

  const setAccentColor = (accentColor: AccentColor) => {
    setSettings(prev => ({ ...prev, accentColor }));
  };

  return (
    <AccessibilityContext.Provider value={{ settings, setFontSize, setAccentColor }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

export const fontSizeOptions: { value: FontSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
];

export const accentColorOptions: { value: AccentColor; label: string; colorClass: string }[] = [
  { value: 'purple', label: 'Purple', colorClass: 'bg-[hsl(246,80%,60%)]' },
  { value: 'blue', label: 'Blue', colorClass: 'bg-[hsl(217,91%,60%)]' },
  { value: 'green', label: 'Green', colorClass: 'bg-[hsl(142,76%,45%)]' },
  { value: 'orange', label: 'Orange', colorClass: 'bg-[hsl(25,95%,53%)]' },
  { value: 'pink', label: 'Pink', colorClass: 'bg-[hsl(330,80%,60%)]' },
];
