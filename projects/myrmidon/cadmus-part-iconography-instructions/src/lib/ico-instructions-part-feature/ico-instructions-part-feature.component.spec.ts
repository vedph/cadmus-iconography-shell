import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodIllumInstructionsPartFeatureComponent } from './ico-instructions-part-feature.component';

describe('CodIllumInstructionsPartFeatureComponent', () => {
  let component: CodIllumInstructionsPartFeatureComponent;
  let fixture: ComponentFixture<CodIllumInstructionsPartFeatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodIllumInstructionsPartFeatureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodIllumInstructionsPartFeatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
