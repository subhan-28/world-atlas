import { ThemeService } from '../theme.service';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { toCommonName, toSearchTerm } from '../country-name.util';

const STORAGE_KEY = 'worldAtlasRecentSearches';
const MAX_RECENT = 5;

@Component({
  selector: 'app-country-flag',
  imports: [CommonModule, RouterLink],
  templateUrl: './country-flag.html',
  styleUrl: './country-flag.css'
})
export class CountryFlag implements OnInit {
  countryName: string = '';
  flagUrl = signal('');
  errorMsg = signal('');
  loading = signal(true);

    constructor(private route: ActivatedRoute, public themeService: ThemeService) {}

  async ngOnInit() {
    this.countryName = this.route.snapshot.paramMap.get('country') || '';
    await this.fetchFlag();
  }

  saveRecentSearch(name: string) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const current: string[] = stored ? JSON.parse(stored) : [];
      const withoutDuplicate = current.filter(
        c => c.toLowerCase() !== name.toLowerCase()
      );
      const updated = [name, ...withoutDuplicate].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage not available (e.g. private mode) — fail silently
    }
  }

  async fetchFlag() {
    this.loading.set(true);
    this.errorMsg.set('');
    try {
      const searchTerm = toSearchTerm(this.countryName);
      const response = await fetch(`https://countries.dev/name/${encodeURIComponent(searchTerm)}`);

      if (!response.ok) {
        this.errorMsg.set(`"${this.countryName}" doesn't look like a country. Try the full country name, e.g. "Pakistan" or "United Kingdom".`);
        this.loading.set(false);
        return;
      }

      const data = await response.json();

      const exactMatch = data?.find((c: any) =>
        toCommonName(c.name).toLowerCase() === this.countryName.toLowerCase()
      );

      if (exactMatch && exactMatch.flags) {
        this.flagUrl.set(exactMatch.flags.svg || exactMatch.flags.png);
        this.saveRecentSearch(toCommonName(exactMatch.name));
      } else {
        this.errorMsg.set(`"${this.countryName}" doesn't look like a country. Try the full country name, e.g. "Pakistan" or "United Kingdom".`);
      }
    } catch (error) {
      console.error('Flag fetch error:', error);
      this.errorMsg.set('Something went wrong — check the console for details');
    } finally {
      this.loading.set(false);
    }
  }
}