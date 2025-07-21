import { TrendService } from './trend.service';

// src/app/services/trend.service.test.ts

describe('TrendService', () => {
  let service: TrendService;

  beforeEach(() => {
    service = new TrendService();
  });

  function makeStats(rollHistory: number[], rolls: Record<number, number> = {}) {
    return { rollHistory, rolls } as any;
  }

  describe('isNumberRising', () => {
    it('should return false if rollHistory is empty', () => {
      const stats = makeStats([], { 3: 0 });
      expect(service.isNumberRising(stats, 3)).toBeFalse();
    });

    it('should return true if recent average equals historical average', () => {
      // 4 rolls, all are 2
      const stats = makeStats([2, 2, 2, 2], { 2: 4 });
      expect(service.isNumberRising(stats, 2)).toBeTrue();
    });

    it('should return true if recent average is greater than historical average', () => {
      // 8 rolls, 2 appears 2 times in first 6, 2 times in last 2
      const stats = makeStats([1, 3, 2, 4, 5, 6, 2, 2], { 2: 4 });
      // historical avg: 4/8 = 0.5, recent avg: last 2 rolls, both are 2 => 2/2 = 1
      expect(service.isNumberRising(stats, 2)).toBeTrue();
    });

    it('should return false if recent average is less than historical average', () => {
      // 8 rolls, 2 appears 4 times in first 6, 0 times in last 2
      const stats = makeStats([2, 2, 2, 2, 3, 4, 5, 6], { 2: 4 });
      // historical avg: 4/8 = 0.5, recent avg: last 2 rolls, both not 2 => 0/2 = 0
      expect(service.isNumberRising(stats, 2)).toBeFalse();
    });

    it('should handle small roll counts and use half the rolls if 25% < 1', () => {
      // 2 rolls, 1 is 1, 2 is 2
      const stats = makeStats([1, 2], { 1: 1, 2: 1 });
      // inspectCount should be 1 (half of 2)
      expect(service.isNumberRising(stats, 2)).toBeTrue(); // recent avg = 1, hist avg = 0.5
      expect(service.isNumberRising(stats, 1)).toBeFalse(); // recent avg = 0, hist avg = 0.5
    });

    it('should round up inspectCount', () => {
      // 5 rolls, 25% = 1.25, should round up to 2
      const stats = makeStats([1, 2, 2, 2, 2], { 2: 4, 1: 1 });
      // last 2 rolls are 2,2, so recent avg = 1, hist avg = 4/5 = 0.8
      expect(service.isNumberRising(stats, 2)).toBeTrue();
    });
  });

  describe('getRecentRolls', () => {
    it('should return array of 1s and 0s for the recent rolls', () => {
      const stats = makeStats([1, 2, 3, 2, 4, 2, 5]);
      // last 4 rolls: 2,4,2,5
      expect(service.getRecentRolls(stats, 2, 4)).toEqual([1, 0, 1, 0]);
    });

    it('should return all rolls if count > rollHistory.length', () => {
      const stats = makeStats([1, 2, 3]);
      expect(service.getRecentRolls(stats, 2, 10)).toEqual([0, 1, 0]);
    });

    it('should return empty array if rollHistory is empty', () => {
      const stats = makeStats([]);
      expect(service.getRecentRolls(stats, 2, 5)).toEqual([]);
    });

    it('should return correct result for count = 1', () => {
      const stats = makeStats([1, 2, 3]);
      expect(service.getRecentRolls(stats, 3, 1)).toEqual([1]);
      expect(service.getRecentRolls(stats, 2, 1)).toEqual([0]);
    });
  });
});