import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountryFlag } from './country-flag';

describe('CountryFlag', () => {
  let component: CountryFlag;
  let fixture: ComponentFixture<CountryFlag>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountryFlag],
    }).compileComponents();

    fixture = TestBed.createComponent(CountryFlag);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
