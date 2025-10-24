import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TankConfig } from './tank-config';

describe('TankConfig', () => {
  let component: TankConfig;
  let fixture: ComponentFixture<TankConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TankConfig]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TankConfig);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
