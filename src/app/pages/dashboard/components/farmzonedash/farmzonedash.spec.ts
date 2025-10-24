import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Farmzonedash } from './farmzonedash';

describe('Farmzonedash', () => {
  let component: Farmzonedash;
  let fixture: ComponentFixture<Farmzonedash>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Farmzonedash]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Farmzonedash);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
