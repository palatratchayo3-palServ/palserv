import { TestBed } from '@angular/core/testing';

import { Newpalfire } from './newpalfire';

describe('Newpalfire', () => {
  let service: Newpalfire;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Newpalfire);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
