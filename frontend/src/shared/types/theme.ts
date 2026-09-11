export type ThemeMode =
  | 'dark'
  | 'light'
  | 'glass'
  | 'liquid-glass'
  | 'neomorphism'
  | 'claymorphism'
  | 'brutalism'
  | 'minimalism'
  | 'maximalism'
  | 'skeuomorphism';

export interface ThemeOption {
  id: ThemeMode;
  name: string;
  icon: string;
  category: 'classic' | 'glass' | 'tactile' | 'expressive';
  categoryLabel: string;
  description: string;
  previewGradient: string;
  borderPreview?: string;
}
