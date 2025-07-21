import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogComponent } from './dialog.component';
import { By } from '@angular/platform-browser';

describe('DialogComponent', () => {
  let component: DialogComponent;
  let fixture: ComponentFixture<DialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DialogComponent);
    component = fixture.componentInstance;
  });

  it('should create the dialog component', () => {
    expect(component).toBeTruthy();
  });

  it('should render title and message', () => {
    component.title = 'Test Title';
    component.message = 'Test Message';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Test Title');
    expect(compiled.querySelector('p')?.textContent).toContain('Test Message');
  });

  it('should call okCallback when OK button is clicked', () => {
    const okSpy = jasmine.createSpy('okCallback');
    component.okCallback = okSpy;
    fixture.detectChanges();
    const okButton = fixture.debugElement.queryAll(By.css('button'))[0];
    okButton.triggerEventHandler('click', null);
    expect(okSpy).toHaveBeenCalled();
  });

  it('should emit cancel event when Cancel button is clicked', () => {
    spyOn(component.cancel, 'emit');
    fixture.detectChanges();
    const cancelButton = fixture.debugElement.queryAll(By.css('button'))[1];
    cancelButton.triggerEventHandler('click', null);
    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should not throw if okCallback is not set and OK is clicked', () => {
    component.okCallback = undefined;
    fixture.detectChanges();
    const okButton = fixture.debugElement.queryAll(By.css('button'))[0];
    expect(() => okButton.triggerEventHandler('click', null)).not.toThrow();
  });
});