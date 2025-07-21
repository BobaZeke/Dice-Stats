import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToasterComponent } from './toaster.component';
import { ToasterService } from '../services/toaster.service';
import { By } from '@angular/platform-browser';

describe('ToasterComponent', () => {
  let component: ToasterComponent;
  let fixture: ComponentFixture<ToasterComponent>;
  let toasterService: ToasterService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToasterComponent],
      providers: [ToasterService],
    }).compileComponents();

    fixture = TestBed.createComponent(ToasterComponent);
    component = fixture.componentInstance;
    toasterService = TestBed.inject(ToasterService);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render no toasts if toaster.toasts is empty', () => {
    toasterService.toasts = [];
    fixture.detectChanges();
    const toastElems = fixture.debugElement.queryAll(By.css('.toast'));
    expect(toastElems.length).toBe(0);
  });

  it('should render a toast for each item in toaster.toasts', () => {
    toasterService.toasts = [
      { id: 1, message: 'Toast 1', state: 'center', sticky: false },
      { id: 2, message: 'Toast 2', state: 'center', sticky: false }
    ];
    fixture.detectChanges();
    const toastElems = fixture.debugElement.queryAll(By.css('.toast'));
    expect(toastElems.length).toBe(2);
    expect(toastElems[0].nativeElement.textContent).toContain('Toast 1');
    expect(toastElems[1].nativeElement.textContent).toContain('Toast 2');
  });

  it('should call toaster.dismiss when sticky toast is clicked', () => {
    const dismissSpy = spyOn(toasterService, 'dismiss');
    toasterService.toasts = [
      { id: 1, message: 'Sticky Toast', state: 'center', sticky: true }
    ];
    fixture.detectChanges();
    const toastElem = fixture.debugElement.query(By.css('.toast'));
    toastElem.triggerEventHandler('click', null);
    expect(dismissSpy).toHaveBeenCalledWith(1);
  });

  it('should not call toaster.dismiss when non-sticky toast is clicked', () => {
    const dismissSpy = spyOn(toasterService, 'dismiss');
    toasterService.toasts = [
      { id: 1, message: 'Non-sticky Toast', state: 'center', sticky: false }
    ];
    fixture.detectChanges();
    const toastElem = fixture.debugElement.query(By.css('.toast'));
    toastElem.triggerEventHandler('click', null);
    expect(dismissSpy).not.toHaveBeenCalled();
  });

  // it('should set toast.width if not set in ngAfterViewChecked', () => {
  //   toasterService.toasts = [
  //     { id: 1, message: 'Toast', state: 'center', sticky: false }
  //   ];
  //   fixture.detectChanges();
  //   // Mock getBoundingClientRect
  //   const elemRef = component.toastElems.first;
  //   spyOn(elemRef.nativeElement, 'getBoundingClientRect').and.returnValue({ width: 123 });
  //   // Remove width to trigger assignment
  //   delete toasterService.toasts[0].width;
  //   component.ngAfterViewChecked();
  //   expect(toasterService.toasts[0].width).toBe(123);
  // });

  it('should not overwrite toast.width if already set in ngAfterViewChecked', () => {
    toasterService.toasts = [
      { id: 1, message: 'Toast', state: 'center', sticky: false, width: 77 }
    ];
    fixture.detectChanges();
    const elemRef = component.toastElems.first;
    spyOn(elemRef.nativeElement, 'getBoundingClientRect').and.returnValue({ width: 123 });
    component.ngAfterViewChecked();
    expect(toasterService.toasts[0].width).toBe(77);
  });

  it('calcCenterStackTop should calculate correct top position', () => {
    // window.innerHeight is used, so we mock it
    spyOnProperty(window, 'innerHeight').and.returnValue(600);
    // For 3 toasts, index 0, 1, 2
    expect(component.calcCenterStackTop(0, 3)).toBe(300 + (0 - 1) * 60);
    expect(component.calcCenterStackTop(1, 3)).toBe(300 + (1 - 1) * 60);
    expect(component.calcCenterStackTop(2, 3)).toBe(300 + (2 - 1) * 60);
  });
});