import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IcoColorReuseEditorComponent } from './ico-color-reuse-editor.component';

describe('IcoColorReuseEditorComponent', () => {
  let component: IcoColorReuseEditorComponent;
  let fixture: ComponentFixture<IcoColorReuseEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IcoColorReuseEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IcoColorReuseEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
