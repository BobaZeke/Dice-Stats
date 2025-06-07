import { Injectable } from '@angular/core';
import { Settings } from '../models/settings';

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  private readonly SETTINGS_KEY = 'DiceStats_UserSettings';

  // Save settings to localStorage
  saveSettings(settings: Settings): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  // Load settings from localStorage
  loadSettings(): Settings {
    const settings = localStorage.getItem(this.SETTINGS_KEY);
    return settings ? JSON.parse(settings) : new Settings();
  }

  // Clear settings
  clearSettings(): void {
    localStorage.removeItem(this.SETTINGS_KEY);
  }
}