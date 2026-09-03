import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountrySearch } from './country-search';

describe('CountrySearch', () => {
  let component: CountrySearch;
  let fixture: ComponentFixture<CountrySearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountrySearch],
    }).compileComponents();

    fixture = TestBed.createComponent(CountrySearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
