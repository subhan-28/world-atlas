import { ThemeService } from '../theme.service';
import { toCommonName } from '../country-name.util';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

const STORAGE_KEY = 'worldAtlasRecentSearches';
const MAX_SUGGESTIONS = 6;

@Component({
  selector: 'app-country-search',
  imports: [FormsModule, CommonModule],
  templateUrl: './country-search.html',
  styleUrl: './country-search.css'
})
export class CountrySearch {
  countryName: string = '';
  isNavigating = signal(false);
  recentSearches = signal<string[]>([]);

  allCountryNames = signal<string[]>([]);
  suggestions = signal<string[]>([]);
  showSuggestions = signal(false);
  activeIndex = signal(-1);

    constructor(private router: Router, public themeService: ThemeService) {
    this.loadRecentSearches();
    this.loadCountryNames();
  }

  async loadCountryNames() {
    try {
      const response = await fetch('https://countries.dev/countries?fields=name&limit=300');
      if (!response.ok) return;
      const raw = await response.json();
      const list = Array.isArray(raw) ? raw : (raw.data ?? []);
      const names = list
        .map((item: any) => (typeof item === 'string' ? item : item?.name))
        .filter((n: string) => !!n)
        .map((n: string) => toCommonName(n));
      const unique = Array.from(new Set<string>(names)).sort();
            this.allCountryNames.set(unique);
    } catch {
      // Autocomplete list failed to load — search still works without it
    } 
  }

    onInputChange() {
    const query = this.countryName.trim().toLowerCase();
    this.activeIndex.set(-1);
    if (!query) {
      this.suggestions.set([]);
      this.showSuggestions.set(false);
      return;
    }

    const startsWith: string[] = [];
    const wordStartsWith: string[] = [];
    const containsOnly: string[] = [];

    for (const name of this.allCountryNames()) {
      const lower = name.toLowerCase();
      if (lower.startsWith(query)) {
        startsWith.push(name);
      } else if (lower.includes(' ' + query) || lower.includes('(' + query)) {
        wordStartsWith.push(name);
      } else if (lower.includes(query)) {
        containsOnly.push(name);
      }
    }

    const matches = [...startsWith, ...wordStartsWith, ...containsOnly].slice(0, MAX_SUGGESTIONS);
    this.suggestions.set(matches);
    this.showSuggestions.set(matches.length > 0);
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.showSuggestions() || this.suggestions().length === 0) return;

    const count = this.suggestions().length;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.set((this.activeIndex() + 1) % count);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.set((this.activeIndex() - 1 + count) % count);
    } else if (event.key === 'Enter') {
      if (this.activeIndex() >= 0) {
        event.preventDefault();
        this.selectSuggestion(this.suggestions()[this.activeIndex()]);
      }
    } else if (event.key === 'Escape') {
      this.closeSuggestions();
    }
  }

  selectSuggestion(name: string) {
    this.countryName = name;
    this.showSuggestions.set(false);
    this.activeIndex.set(-1);
    this.goToCountry(name);
  }

  closeSuggestions() {
    this.showSuggestions.set(false);
    this.activeIndex.set(-1);
  }

  loadRecentSearches() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      this.recentSearches.set(stored ? JSON.parse(stored) : []);
    } catch {
      this.recentSearches.set([]);
    }
  }

  removeRecentSearch(name: string, event: Event) {
    event.stopPropagation();
    try {
      const updated = this.recentSearches().filter(
        c => c.toLowerCase() !== name.toLowerCase()
      );
      this.recentSearches.set(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // fail silently
    }
  }

  clearAllRecent() {
    try {
      this.recentSearches.set([]);
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // fail silently
    }
  }

  goToCountry(name: string) {
    if (this.isNavigating()) return;
    this.isNavigating.set(true);
    this.router.navigate(['/flag', name]);
  }

  onSubmit() {
    if (this.showSuggestions() && this.activeIndex() >= 0) {
      return;
    }
    const trimmed = this.countryName.trim();
    if (!trimmed || this.isNavigating()) return;
    this.showSuggestions.set(false);
    this.goToCountry(trimmed);
  }

  searchRecent(name: string) {
    this.goToCountry(name);
  }
}