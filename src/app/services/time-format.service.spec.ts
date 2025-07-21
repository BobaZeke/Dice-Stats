import { TestBed } from '@angular/core/testing';
import { TimeFormatService } from './time-format.service';

// src/app/services/time-format.service.test.ts

describe('TimeFormatService', () => {
  let service: TimeFormatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeFormatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have defaultEmptyTime as "0:00:00"', () => {
    expect(service.defaultEmptyTime).toBe("0:00:00");
  });

  describe('calculateDuration', () => {
    it('should return 0 if startTime equals currentTime', () => {
      expect(service.calculateDuration(1000, 1000)).toBe(0);
    });

    it('should return correct seconds for positive difference', () => {
      expect(service.calculateDuration(1000, 4000)).toBe(3);
      expect(service.calculateDuration(0, 6500)).toBe(6);
    });

    it('should return negative seconds for negative difference', () => {
      expect(service.calculateDuration(5000, 1000)).toBe(-4);
    });

    it('should floor the result', () => {
      expect(service.calculateDuration(0, 1999)).toBe(1);
      expect(service.calculateDuration(0, 2999)).toBe(2);
    });
  });

  describe('formatDuration', () => {
    it('should format 0 seconds as "0:00:00"', () => {
      expect(service.formatDuration(0)).toBe("0:00:00");
    });

    it('should format less than 1 minute correctly', () => {
      expect(service.formatDuration(5)).toBe("0:00:05");
      expect(service.formatDuration(59)).toBe("0:00:59");
    });

    it('should format minutes and seconds correctly', () => {
      expect(service.formatDuration(60)).toBe("0:01:00");
      expect(service.formatDuration(125)).toBe("0:02:05");
    });

    it('should format hours, minutes, and seconds correctly', () => {
      expect(service.formatDuration(3600)).toBe("1:00:00");
      expect(service.formatDuration(3661)).toBe("1:01:01");
      expect(service.formatDuration(7325)).toBe("2:02:05");
    });

    it('should pad minutes and seconds with zeros', () => {
      expect(service.formatDuration(3661)).toBe("1:01:01");
      expect(service.formatDuration(3725)).toBe("1:02:05");
    });
  });

  describe('calcAndFormatDuration', () => {
    it('should calculate and format duration without savedDuration', () => {
      // 2 seconds difference
      const start = 1000, current = 3000;
      expect(service.calcAndFormatDuration(start, current)).toBe("0:00:02");
    });

    it('should calculate and format duration with savedDuration', () => {
      // 2 seconds difference + 5 saved = 7
      const start = 1000, current = 3000, saved = 5;
      expect(service.calcAndFormatDuration(start, current, saved)).toBe("0:00:07");
    });

    it('should handle large durations', () => {
      // 1 hour, 2 minutes, 3 seconds = 3723 seconds
      const start = 0, current = 3723000;
      expect(service.calcAndFormatDuration(start, current)).toBe("1:02:03");
    });
  });
});