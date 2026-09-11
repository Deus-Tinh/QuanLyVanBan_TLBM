export type ThemeMode = 'dark' | 'light' | 'glass';

export interface ThemeOption {
  id: ThemeMode;
  name: string;
  icon: string;
  description: string;
}
