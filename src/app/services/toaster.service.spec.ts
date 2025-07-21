import { TestBed } from '@angular/core/testing';
import { ToasterService } from './toaster.service';
import { Toast } from '../models/toast';

// src/app/services/toaster.service.test.ts

describe('ToasterService', () => {
  let service: ToasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToasterService);
    service.toasts = [];
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a toast with correct properties', () => {
    service.show('Hello', false);
    expect(service.toasts.length).toBe(1);
    const toast = service.toasts[0];
    expect(toast.message).toBe('Hello');
    expect(toast.state).toBe('center');
    expect(toast.sticky).toBe(false);
    expect(typeof toast.id).toBe('number');
  });

  it('should increment id for each toast', () => {
    service.show('First');
    service.show('Second');
    expect(service.toasts[0].id).not.toBe(service.toasts[1].id);
  });

  it('should set state to "float-top" after 1700ms', () => {
    service.show('Test');
    const toast = service.toasts[0];
    jasmine.clock().tick(1699);
    expect(toast.state).toBe('center');
    jasmine.clock().tick(1);
    expect(toast.state).toBe('float-top');
  });

  it('should auto-dismiss toast after 5000ms if not sticky', () => {
    service.show('Dismiss me');
    const toast = service.toasts[0];
    jasmine.clock().tick(4999);
    expect(service.toasts.length).toBe(1);
    jasmine.clock().tick(1);
    expect(service.toasts.length).toBe(0);
  });

  it('should not auto-dismiss sticky toast', () => {
    service.show('Sticky', true);
    jasmine.clock().tick(10000);
    expect(service.toasts.length).toBe(1);
  });

  it('should remove toast by id when dismiss is called', () => {
    service.show('To be removed');
    const id = service.toasts[0].id;
    service.dismiss(id);
    expect(service.toasts.length).toBe(0);
  });

  it('should only remove the toast with the given id', () => {
    service.show('First');
    service.show('Second');
    const idToRemove = service.toasts[0].id;
    service.dismiss(idToRemove);
    expect(service.toasts.length).toBe(1);
    expect(service.toasts[0].message).toBe('Second');
  });
});