import { TestBed } from '@angular/core/testing';
import { UserSettingsService } from './user-settings.service';
import { Settings } from '../models/settings';

// src/app/services/user-settings.service.test.ts

describe('UserSettingsService', () => {
  let service: UserSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserSettingsService);
    spyOn(localStorage, 'setItem').and.callFake(() => {});
    spyOn(localStorage, 'getItem').and.callFake(() => null);
    spyOn(localStorage, 'removeItem').and.callFake(() => {});
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save settings to localStorage', () => {
    const settings = { foo: 'bar' } as any as Settings;
    service.saveSettings(settings);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'DiceStats_UserSettings',
      JSON.stringify(settings)
    );
  });

  it('should load settings from localStorage if present', () => {
    const stored = { theme: 'dark', volume: 5 };
    (localStorage.getItem as jasmine.Spy).and.returnValue(JSON.stringify(stored));
    const result = service.loadSettings();
    expect(result).toEqual(stored as any as Settings);
  });

  it('should return new Settings if nothing in localStorage', () => {
    (localStorage.getItem as jasmine.Spy).and.returnValue(null);
    const result = service.loadSettings();
    expect(result instanceof Settings).toBeTrue();
  });

  it('should clear settings from localStorage', () => {
    service.clearSettings();
    expect(localStorage.removeItem).toHaveBeenCalledWith('DiceStats_UserSettings');
  });
});