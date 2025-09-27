import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IcoInstructionsPartFeatureComponent } from './ico-instructions-part-feature.component';

describe('CodIllumInstructionsPartFeatureComponent', () => {
  let component: IcoInstructionsPartFeatureComponent;
  let fixture: ComponentFixture<IcoInstructionsPartFeatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IcoInstructionsPartFeatureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IcoInstructionsPartFeatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
