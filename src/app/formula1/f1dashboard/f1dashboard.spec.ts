import { ComponentFixture, TestBed } from '@angular/core/testing';

import { F1dashboard } from './f1dashboard';

describe('F1dashboard', () => {
  let component: F1dashboard;
  let fixture: ComponentFixture<F1dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [F1dashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(F1dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
