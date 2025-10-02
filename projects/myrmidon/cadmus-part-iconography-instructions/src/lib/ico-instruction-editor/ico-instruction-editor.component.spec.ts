import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IcoInstructionEditorComponent } from './ico-instruction-editor.component';

describe('IcoInstructionsEditorComponent', () => {
  let component: IcoInstructionEditorComponent;
  let fixture: ComponentFixture<IcoInstructionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IcoInstructionEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IcoInstructionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
