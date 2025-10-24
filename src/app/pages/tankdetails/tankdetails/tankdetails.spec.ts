import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tankdetails } from './tankdetails';

describe('Tankdetails', () => {
  let component: Tankdetails;
  let fixture: ComponentFixture<Tankdetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tankdetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tankdetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
