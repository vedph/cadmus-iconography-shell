import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IcoInstructionDiffEditorComponent } from './ico-instruction-diff-editor.component';

describe('IcoInstructionDiffEditorComponent', () => {
  let component: IcoInstructionDiffEditorComponent;
  let fixture: ComponentFixture<IcoInstructionDiffEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IcoInstructionDiffEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IcoInstructionDiffEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
