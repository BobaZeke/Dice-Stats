import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { ColorService } from './services/color.service';
import { SoundService } from './services/sound.service';
import { TrendService } from './services/trend.service';
import { UserSettingsService } from './services/user-settings.service';
import { GameTimerService } from './services/timer.service';
import { ToasterService } from './services/toaster.service';
import { TimeFormatService } from './services/time-format.service';
import { DialogComponent } from './dialog/dialog.component';
import { ToasterComponent } from './toaster/toaster.component';
import { ElementRef, ChangeDetectorRef } from '@angular/core';
import { Stats } from './models/stats';
import { Settings } from './models/settings';
import { ColorOption } from './models/color-option.enum';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let colorService: ColorService;
  let soundService: SoundService;
  let trendService: TrendService;
  let userSettingsService: UserSettingsService;
  let timerService: GameTimerService;
  let toaster: ToasterService;
  let formatService: TimeFormatService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, DialogComponent, ToasterComponent], // Standalone components
      // declarations: [AppComponent],  //  not for standalone components
      providers: [
        ColorService,
        SoundService,
        TrendService,
        UserSettingsService,
        GameTimerService,
        ToasterService,
        TimeFormatService,
        { provide: ElementRef, useValue: { nativeElement: document.createElement('div') } },
        { provide: ChangeDetectorRef, useValue: { detectChanges: () => {} } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    colorService = TestBed.inject(ColorService);
    soundService = TestBed.inject(SoundService);
    trendService = TestBed.inject(TrendService);
    userSettingsService = TestBed.inject(UserSettingsService);
    timerService = TestBed.inject(GameTimerService);
    toaster = TestBed.inject(ToasterService);
    formatService = TestBed.inject(TimeFormatService);
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize timers and set default displays', () => {
    component.initializeTimers();
    expect(component.turnDurationDisplay).toBe(formatService.defaultEmptyTime);
    expect(component.gameStats.playingDurationDisplay).toBe(formatService.defaultEmptyTime);
    expect(component.gameStats.breakDurationDisplay).toBe(formatService.defaultEmptyTime);
    expect(component.betweenBreaksDuration).toBe(formatService.defaultEmptyTime);
    expect(component.totalBreakDuration).toBe(formatService.defaultEmptyTime);
    expect(component.tourneyStats.playingDurationDisplay).toBe(formatService.defaultEmptyTime);
    expect(component.tourneyStats.breakDurationDisplay).toBe(formatService.defaultEmptyTime);
  });

  it('hasNoGameActivity returns true if no rolls and no history', () => {
    component.gameStats.rollHistory = [];
    component.gameHistory = [];
    expect(component.hasNoGameActivity()).toBeTrue();
  });

  it('hasNoGameActivity returns false if there are rolls', () => {
    component.gameStats.rollHistory = [2];
    component.gameHistory = [];
    expect(component.hasNoGameActivity()).toBeFalse();
  });

  it('hasNoGameActivity returns false if there is game history', () => {
    component.gameStats.rollHistory = [];
    component.gameHistory = [new Stats()];
    expect(component.hasNoGameActivity()).toBeFalse();
  });

  it('addTimeStrings adds two time strings correctly', () => {
    expect(component.addTimeStrings('0:01:00', '0:02:30')).toBe('0:03:30');
    expect(component.addTimeStrings('1:00:00', '0:30:00')).toBe('1:30:00');
    expect(component.addTimeStrings('0:00:59', '0:00:02')).toBe('0:01:01');
  });

  it('secondsFromTimeString parses hh:mm:ss and mm:ss', () => {
    expect(component.secondsFromTimeString('1:02:03')).toBe(3723);
    expect(component.secondsFromTimeString('02:03')).toBe(123);
  });

  it('toggleFixedColors toggles the setting and saves', () => {
    const saveSpy = spyOn(component, 'saveSettings');
    component.settings.fixedColors = false;
    component.toggleFixedColors();
    expect(component.settings.fixedColors).toBeTrue();
    expect(saveSpy).toHaveBeenCalled();
  });

  it('togglePauseDropdown toggles pauseDropdownOpen', () => {
    component.pauseDropdownOpen = false;
    component.togglePauseDropdown();
    expect(component.pauseDropdownOpen).toBeTrue();
    component.togglePauseDropdown();
    expect(component.pauseDropdownOpen).toBeFalse();
  });

  it('closePauseDropdown sets pauseDropdownOpen to false', () => {
    component.pauseDropdownOpen = true;
    component.closePauseDropdown();
    expect(component.pauseDropdownOpen).toBeFalse();
  });

  it('toggleColorType toggles colorType and colorOption', () => {
    component.settings.colorOption = ColorOption.Density;
    component.colorType = true;
    const saveSpy = spyOn(component, 'saveSettings');
    spyOn(soundService, 'playSoundBump');
    component.toggleColorType();
    expect(component.colorType).toBeFalse();
    expect(component.settings.colorOption).toBe(ColorOption.Color);
    expect(saveSpy).toHaveBeenCalled();
    expect(soundService.playSoundBump).toHaveBeenCalled();
  });

  it('toggleColorPicker toggles colorPickerAll and plays sound', () => {
    component.colorPickerAll = false;
    spyOn(soundService, 'playSoundBump');
    component.toggleColorPicker();
    expect(component.colorPickerAll).toBeTrue();
    expect(soundService.playSoundBump).toHaveBeenCalled();
  });

  it('toggleDiePercent toggles showDiceCounts and saves', () => {
    component.settings.showDiceCounts = false;
    spyOn(soundService, 'playSoundBump');
    const saveSpy = spyOn(component, 'saveSettings');
    component.toggleDiePercent();
    expect(component.settings.showDiceCounts).toBeTrue();
    expect(saveSpy).toHaveBeenCalled();
    expect(soundService.playSoundBump).toHaveBeenCalled();
  });

  it('toggleSounds toggles playSounds and saves', () => {
    component.settings.playSounds = false;
    spyOn(soundService, 'playSoundBump');
    spyOn(soundService, 'playSoundEscape');
    const saveSpy = spyOn(component, 'saveSettings');
    component.toggleSounds();
    expect(component.settings.playSounds).toBeTrue();
    expect(soundService.playSoundBump).toHaveBeenCalled();
    expect(saveSpy).toHaveBeenCalled();
    component.toggleSounds();
    expect(component.settings.playSounds).toBeFalse();
    expect(soundService.playSoundEscape).toHaveBeenCalled();
  });

  it('getBarPercent returns correct percent string', () => {
    component.bars = [];
    component.bars[7] = 5;
    spyOn(component, 'rollCount').and.returnValue(10);
    expect(component.getBarPercent(7, 1)).toBe('50.0');
    component.bars[7] = 0;
    expect(component.getBarPercent(7, 1)).toBe('0.0');
  });

  it('getTourneyBarPercent returns correct percent', () => {
    component.tourneyStats.rolls = { 7: 5 };
    component.tourneyStats.rollHistory = [7, 7, 7, 7, 7, 2, 3, 4, 5, 6];
    expect(component.getTourneyBarPercent(7)).toBe(50);
  });

  it('calculateAverageInterval returns 0 if no rolls', () => {
    component.gameStats.rollHistory = [];
    expect(component.calculateAverageInterval(7)).toBe(0);
  });

  it('calculateAverageInterval returns correct average', () => {
    component.gameStats.rollHistory = [2, 7, 3, 7, 7];
    expect(component.calculateAverageInterval(7)).toBe((5 / 3).toFixed(1));
  });

  it('calculateAverageInterval returns rollHistory.length if number not found', () => {
    component.gameStats.rollHistory = [2, 3, 4];
    expect(component.calculateAverageInterval(7)).toBe(3);
  });

  it('getRollHistory returns correct string', () => {
    component.gameStats.rollHistory = [2, 7, 3];
    component.rollHistoryHit = 'X';
    component.rollHistoryMiss = 'O';
    expect(component.getRollHistory(7)).toBe('OXO');
  });

  it('maxRollCount returns 0 if no gameStats', () => {
    component.gameStats = null as any;
    expect(component.maxRollCount()).toBe(0);
  });

  it('maxRollCount returns max value from rolls', () => {
    component.gameStats = new Stats();
    component.gameStats.rolls = { 2: 1, 3: 5, 4: 3 };
    expect(component.maxRollCount()).toBe(5);
  });

  it('maxRollCountTourney returns max value from tourneyStats', () => {
    component.tourneyStats.rolls = { 2: 1, 3: 5, 4: 3 };
    expect(component.maxRollCountTourney()).toBe(5);
  });

  it('selectDiceRoll sets currentDiceRoll and calls storeValues', () => {
    spyOn(component, 'storeValues');
    component.settings.playSounds = true;
    spyOn(soundService, 'playSoundNumberSelect');
    component.selectDiceRoll(7);
    expect(component.currentDiceRoll).toBe(7);
    expect(component.storeValues).toHaveBeenCalled();
    expect(soundService.playSoundNumberSelect).toHaveBeenCalled();
  });

  it('storeValues updates stats and plays correct sound', () => {
    component.currentDiceRoll = 7;
    component.settings.playSounds = true;
    spyOn(soundService, 'playSoundSeven');
    spyOn(soundService, 'playSoundSuccess');
    // spyOn(component, 'updateDisplay');
    spyOn(component, 'adjustOverlayFontSize');
    spyOn(timerService, 'reset');
    spyOn(timerService, 'start');
    component.storeValues();
    expect(component.currentRoll).toBe(7);
    expect(component.gameStats.rolls[7]).toBe(1);
    expect(component.tourneyStats.rolls[7]).toBe(1);
    expect(component.gameStats.rollHistory[0]).toBe(7);
    expect(component.tourneyStats.rollHistory[0]).toBe(7);
    expect(soundService.playSoundSeven).toHaveBeenCalled();
    // expect(component.updateDisplay).toHaveBeenCalled();
    expect(component.adjustOverlayFontSize).toHaveBeenCalled();
    expect(timerService.reset).toHaveBeenCalled();
    expect(timerService.start).toHaveBeenCalled();
  });

  it('storeValues plays failure sound if invalid', () => {
    component.currentDiceRoll = 0;
    component.settings.playSounds = true;
    spyOn(soundService, 'playSoundFailure');
    // spyOn(component, 'updateDisplay');
    spyOn(component, 'adjustOverlayFontSize');
    component.storeValues();
    expect(soundService.playSoundFailure).toHaveBeenCalled();
    // expect(component.updateDisplay).toHaveBeenCalled();
    expect(component.adjustOverlayFontSize).toHaveBeenCalled();
  });

  it('undoLastRoll calls performRollUndo if rollHistory not empty', () => {
    component.gameStats.rollHistory = [2, 3];
    spyOn(component, 'performRollUndo');
    component.undoLastRoll();
    expect(component.performRollUndo).toHaveBeenCalled();
  });

  it('performRollUndo pops last roll and updates stats', () => {
    component.gameStats.rollHistory = [2, 3];
    component.tourneyStats.rollHistory = [2, 3];
    component.gameStats.rolls = { 2: 1, 3: 1 };
    component.tourneyStats.rolls = { 2: 1, 3: 1 };
    // spyOn(component, 'updateDisplay');
    component.performRollUndo();
    expect(component.gameStats.rollHistory).toEqual([2]);
    expect(component.tourneyStats.rollHistory).toEqual([2]);
    expect(component.gameStats.rolls[3]).toBe(0);
    expect(component.tourneyStats.rolls[3]).toBe(0);
    // expect(component.updateDisplay).toHaveBeenCalled();
  });

  it('handleDialogCancel sets showDialog to false', () => {
    component.showDialog = true;
    component.handleDialogCancel();
    expect(component.showDialog).toBeFalse();
  });

  it('resetSettings sets dialog properties and shows dialog', () => {
    component.resetSettings();
    expect(component.dialogTitle).toBe('Reset All Settings?');
    expect(component.dialogMessage).toContain('reset all settings');
    expect(component.showDialog).toBeTrue();
    expect(typeof component.dialogOkFunction).toBe('function');
  });

  it('performSettingsReset resets settings and updates display', () => {
    // spyOn(component, 'updateDisplay');
    component.settings = { ...component.settings, foo: 'bar' } as any;
    component.performSettingsReset();
    expect(component.showDialog).toBeFalse();
    expect(component.settings).toBeTruthy();
    // expect(component.updateDisplay).toHaveBeenCalled();
  });

  it('showHelp sets showHelpDialog to true', () => {
    component.showHelpDialog = false;
    component.showHelp();
    expect(component.showHelpDialog).toBeTrue();
  });

  it('showColorSettingsDialog shows color help and pauses game if needed', () => {
    spyOn(component, 'isDiceContainerVisible').and.returnValue(true);
    spyOn(component, 'toggleDiceContainer');
    component.gameIsPaused = false;
    component.gameIsStopped = false;
    spyOn(component, 'pauseGame');
    component.showColorSettingsDialog();
    expect(component.showColorHelp).toBeTrue();
    expect(component.pauseGame).toHaveBeenCalled();
  });

  it('closeColorSettingsDialog hides color settings and resumes game if not stopped', () => {
    component.showColorSettings = true;
    component.gameIsStopped = false;
    spyOn(component, 'pauseGame');
    component.closeColorSettingsDialog();
    expect(component.showColorSettings).toBeFalse();
    expect(component.pauseGame).toHaveBeenCalled();
  });

  it('closeColorHelp hides color help and shows color settings', () => {
    component.showColorHelp = true;
    component.showColorSettings = false;
    component.closeColorHelp();
    expect(component.showColorHelp).toBeFalse();
    expect(component.showColorSettings).toBeTrue();
  });

  // Add more tests for navigation/history/tournament toggles as needed
});