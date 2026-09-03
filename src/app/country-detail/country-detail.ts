import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { toCommonName, toSearchTerm } from '../country-name.util';
import { ThemeService } from '../theme.service';

interface Neighbour {
  name: string;
  flagUrl: string;
}

@Component({
  selector: 'app-country-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './country-detail.html',
  styleUrl: './country-detail.css'
})
export class CountryDetail implements OnInit, OnDestroy {
  countryName: string = '';
  flagUrl = signal('');
  capital = signal('Not available');
  region = signal('Not available');
  subregion = signal('Not available');
  population = signal('Not available');
  languages = signal('Not available');
  currency = signal('Not available');
  area = signal('Not available');
  demonym = signal('Not available');
  callingCode = signal('Not available');
  timezones = signal('Not available');
  topLevelDomain = signal('Not available');
  errorMsg = signal('');
  loading = signal(true);

  neighbours = signal<Neighbour[]>([]);
  loadingNeighbours = signal(false);
  neighboursChecked = signal(false);

  private paramSub?: Subscription;

  constructor(private route: ActivatedRoute, public themeService: ThemeService) {}

  ngOnInit() {
    this.paramSub = this.route.paramMap.subscribe(params => {
      this.countryName = params.get('country') || '';
      this.fetchDetails();
    });
  }

  ngOnDestroy() {
    this.paramSub?.unsubscribe();
  }

  animatePopulation(target: number) {
    const duration = 900;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      this.population.set(current.toLocaleString());
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.population.set(target.toLocaleString());
      }
    };

    requestAnimationFrame(step);
  }

  extractDemonym(c: any): string {
    if (typeof c.demonym === 'string' && c.demonym) return c.demonym;
    const demonyms = c.demonyms;
    if (demonyms) {
      if (typeof demonyms === 'string') return demonyms;
      const eng = demonyms.eng;
      if (eng) return eng.m || eng.f || 'Not available';
      const firstKey = Object.keys(demonyms)[0];
      if (firstKey) {
        const entry = demonyms[firstKey];
        if (typeof entry === 'string') return entry;
        if (entry?.m || entry?.f) return entry.m || entry.f;
      }
    }
    return 'Not available';
  }

  extractCallingCode(c: any): string {
    if (c.idd?.root) {
      if (c.idd.suffixes && c.idd.suffixes.length === 1) {
        return c.idd.root + c.idd.suffixes[0];
      }
      return c.idd.root;
    }
    if (Array.isArray(c.callingCodes) && c.callingCodes.length > 0) {
      const code = c.callingCodes[0];
      return code.startsWith('+') ? code : `+${code}`;
    }
    return 'Not available';
  }

  extractTimezones(timezones: any): string {
    if (!Array.isArray(timezones) || timezones.length === 0) return 'Not available';
    if (timezones.length <= 3) return timezones.join(', ');
    return `${timezones.slice(0, 3).join(', ')} +${timezones.length - 3} more`;
  }

  extractTLD(c: any): string {
    const tld = c.topLevelDomain || c.tld;
    if (Array.isArray(tld) && tld.length > 0) return tld.join(', ');
    return 'Not available';
  }

  async fetchDetails() {
    this.loading.set(true);
    this.errorMsg.set('');
    this.neighbours.set([]);
    this.neighboursChecked.set(false);
    this.loadingNeighbours.set(false);

    try {
      const searchTerm = toSearchTerm(this.countryName);
      const response = await fetch(`https://countries.dev/name/${encodeURIComponent(searchTerm)}`);

      if (!response.ok) {
        this.errorMsg.set(`Couldn't load details for "${this.countryName}".`);
        this.loading.set(false);
        return;
      }

      const data = await response.json();
      const exactMatch = data?.find((c: any) =>
        toCommonName(c.name).toLowerCase() === this.countryName.toLowerCase()
      );

      if (!exactMatch) {
        this.errorMsg.set(`Couldn't load details for "${this.countryName}".`);
        this.loading.set(false);
        return;
      }

      if (exactMatch.flags) {
        this.flagUrl.set(exactMatch.flags.svg || exactMatch.flags.png);
      } else {
        this.flagUrl.set('');
      }

      this.capital.set('Not available');
      if (exactMatch.capital) {
        const cap = Array.isArray(exactMatch.capital)
          ? exactMatch.capital.join(', ')
          : exactMatch.capital;
        this.capital.set(cap || 'Not available');
      }

      this.region.set(exactMatch.region || 'Not available');
      this.subregion.set(exactMatch.subregion || 'Not available');

      if (exactMatch.population) {
        this.population.set('0');
        this.animatePopulation(exactMatch.population);
      } else {
        this.population.set('Not available');
      }

      this.languages.set('Not available');
      if (exactMatch.languages) {
        const rawLangs = Array.isArray(exactMatch.languages)
          ? exactMatch.languages
          : Object.values(exactMatch.languages);

        const langs = rawLangs
          .map((l: any) => (typeof l === 'string' ? l : l?.name || ''))
          .filter((l: string) => l)
          .join(', ');

        this.languages.set(langs || 'Not available');
      }

      this.currency.set('Not available');
      if (exactMatch.currencies) {
        const currencyNames = Object.values(exactMatch.currencies)
          .map((c: any) => c.name)
          .join(', ');
        this.currency.set(currencyNames || 'Not available');
      }

      this.area.set(
        exactMatch.area ? `${exactMatch.area.toLocaleString()} km²` : 'Not available'
      );

      this.demonym.set(this.extractDemonym(exactMatch));
      this.callingCode.set(this.extractCallingCode(exactMatch));
      this.timezones.set(this.extractTimezones(exactMatch.timezones));
      this.topLevelDomain.set(this.extractTLD(exactMatch));

      this.loading.set(false);
      await this.fetchNeighbours(exactMatch.borders);

    } catch (error) {
      console.error('Detail fetch error:', error);
      this.errorMsg.set('Something went wrong — check the console for details');
      this.loading.set(false);
    }
  }

  async fetchNeighbours(borderCodes: string[] | undefined) {
    if (!borderCodes || borderCodes.length === 0) {
      this.neighboursChecked.set(true);
      return;
    }

    this.loadingNeighbours.set(true);
    try {
      const results = await Promise.allSettled(
        borderCodes.map(async (code) => {
          const res = await fetch(`https://countries.dev/alpha/${code}`);
          if (!res.ok) throw new Error('not found');
          const country = await res.json();
          return {
            name: toCommonName(country.name),
            flagUrl: country.flags?.svg || country.flags?.png || ''
          };
        })
      );

      const resolved = results
        .filter((r): r is PromiseFulfilledResult<Neighbour> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter(n => n.flagUrl);

      this.neighbours.set(resolved);
    } catch {
      // Neighbours are a bonus feature — fail silently if something goes wrong
    } finally {
      this.loadingNeighbours.set(false);
      this.neighboursChecked.set(true);
    }
  }
}