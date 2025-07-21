import { TestBed } from '@angular/core/testing';
import { GameTimerService, TimerHandle } from './timer.service';
import { TimeFormatService } from './time-format.service';
import { fakeAsync, tick } from '@angular/core/testing';

// src/app/services/timer.service.test.ts

class MockTimeFormatService {
  defaultEmptyTime = '0:00:00';
  formatDuration = jasmine.createSpy('formatDuration').and.callFake((secs: number) => `formatted:${secs}`);
}

describe('GameTimerService', () => {
  let service: GameTimerService;
  let formatService: MockTimeFormatService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GameTimerService,
        { provide: TimeFormatService, useClass: MockTimeFormatService }
      ]
    });
    service = TestBed.inject(GameTimerService);
    formatService = TestBed.inject(TimeFormatService) as any;
  });

  describe('createTimer', () => {
    it('should create a timer with default values', () => {
      const timer = service.createTimer();
      expect(timer.intervalId).toBeNull();
      expect(timer.startTime).toBeNull();
      expect(timer.elapsed).toBe(0);
      expect(timer.display$).toBeTruthy();
      let emitted: string | undefined;
      timer.display$.subscribe(val => emitted = val);
      expect(emitted).toBe(formatService.defaultEmptyTime);
    });
  });

  describe('start', () => {
    it('should set startTime and intervalId, and call updateDisplay', fakeAsync(() => {
      const timer = service.createTimer();
      spyOn(service, 'updateDisplay');
      service.start(timer);
      expect(timer.startTime).toBeTruthy();
      expect(timer.intervalId).toBeTruthy();
      tick(1000);
      expect(service.updateDisplay).toHaveBeenCalledWith(timer);
      service.stop(timer);
    }));

    it('should not start if already running', () => {
      const timer = service.createTimer();
      timer.intervalId = 123;
      spyOn(service, 'updateDisplay');
      service.start(timer);
      expect(service.updateDisplay).not.toHaveBeenCalled();
    });

    it('should call updateFn every tick', fakeAsync(() => {
      const timer = service.createTimer();
      const updateFn = jasmine.createSpy('updateFn');
      service.start(timer, updateFn);
      tick(1000);
      expect(updateFn).toHaveBeenCalled();
      service.stop(timer);
    }));
  });

  describe('stop', () => {
    it('should clear interval, update elapsed, reset intervalId/startTime, and call updateDisplay', fakeAsync(() => {
      const timer = service.createTimer();
      service.start(timer);
      const startTime = timer.startTime!;
      tick(2000);
      spyOn(service, 'updateDisplay');
      service.stop(timer);
      expect(timer.intervalId).toBeNull();
      expect(timer.startTime).toBeNull();
      expect(timer.elapsed).toBeGreaterThanOrEqual(2000);
      expect(service.updateDisplay).toHaveBeenCalledWith(timer);
    }));

    it('should do nothing if not running', () => {
      const timer = service.createTimer();
      spyOn(service, 'updateDisplay');
      service.stop(timer);
      expect(service.updateDisplay).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should stop, set elapsed to 0, and emit defaultEmptyTime', () => {
      const timer = service.createTimer();
      timer.elapsed = 5000;
      spyOn(service, 'stop');
      let emitted: string | undefined;
      timer.display$.subscribe(val => emitted = val);
      service.reset(timer);
      expect(service.stop).toHaveBeenCalledWith(timer);
      expect(timer.elapsed).toBe(0);
      expect(emitted).toBe(formatService.defaultEmptyTime);
    });
  });

  describe('updateDisplay', () => {
    it('should emit formatted duration based on elapsed only', () => {
      const timer = service.createTimer();
      timer.elapsed = 5000;
      timer.startTime = null;
      let emitted: string | undefined;
      timer.display$.subscribe(val => emitted = val);
      service.updateDisplay(timer);
      expect(formatService.formatDuration).toHaveBeenCalledWith(5);
      expect(emitted).toBe('formatted:5');
    });

    it('should emit formatted duration based on elapsed + running time', fakeAsync(() => {
      const timer = service.createTimer();
      timer.elapsed = 2000;
      service.start(timer);
      let emitted: string | undefined;
      timer.display$.subscribe(val => emitted = val);
      tick(3000);
      service.updateDisplay(timer);
      // elapsed + (now - startTime) = 2000 + 3000 = 5000 ms = 5 sec
      expect(formatService.formatDuration).toHaveBeenCalledWith(5);
      expect(emitted).toBe('formatted:5');
      service.stop(timer);
    }));
  });

  describe('getDisplay', () => {
    it('should return an observable that emits display$ values', () => {
      const timer = service.createTimer();
      const obs = service.getDisplay(timer);
      let emitted: string | undefined;
      obs.subscribe(val => emitted = val);
      expect(emitted).toBe(formatService.defaultEmptyTime);
      timer.display$.next('formatted:123');
      expect(emitted).toBe('formatted:123');
    });
  });
});