import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'worldAtlasTheme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(false);

  constructor() {
    const stored = this.getStoredTheme();
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored !== null ? stored : !!prefersDark;
    this.setTheme(shouldBeDark);
  }

  private getStoredTheme(): boolean | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      return null;
    } catch {
      return null;
    }
  }

  toggleTheme() {
    this.setTheme(!this.isDark());
  }

  setTheme(dark: boolean) {
    this.isDark.set(dark);
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    } catch {
      // fail silently
    }
  }
}