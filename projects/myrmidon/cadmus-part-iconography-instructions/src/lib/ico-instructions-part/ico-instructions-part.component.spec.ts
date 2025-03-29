import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IcoInstructionsPartComponent } from './ico-instructions-part.component';

describe('IcoInstructionsPartComponent', () => {
  let component: IcoInstructionsPartComponent;
  let fixture: ComponentFixture<IcoInstructionsPartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IcoInstructionsPartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IcoInstructionsPartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
