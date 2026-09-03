import { Routes } from '@angular/router';
import { CountrySearch } from './country-search/country-search';
import { CountryFlag } from './country-flag/country-flag';
import { CountryDetail } from './country-detail/country-detail';

export const routes: Routes = [
  { path: '', component: CountrySearch },
  { path: 'flag/:country', component: CountryFlag },
  { path: 'details/:country', component: CountryDetail },
  { path: '**', redirectTo: '' }
];