import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tankhistory } from './tankhistory';

describe('Tankhistory', () => {
  let component: Tankhistory;
  let fixture: ComponentFixture<Tankhistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tankhistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tankhistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
