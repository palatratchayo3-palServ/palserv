import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tankcontrol } from './tankcontrol';

describe('Tankcontrol', () => {
  let component: Tankcontrol;
  let fixture: ComponentFixture<Tankcontrol>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tankcontrol]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tankcontrol);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
