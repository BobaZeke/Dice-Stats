import { Component, HostListener, OnInit, AfterViewInit, ChangeDetectorRef, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule, KeyValue } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Stats } from './models/stats';
import { SoundService } from './services/sound.service';
import { TimeFormatService } from './services/time-format.service'; // Add this line
import { ColorOption } from './models/color-option.enum'; // Import the enum
import { ColorService } from './services/color.service';
import { TrendService } from './services/trend.service';
import { UserSettingsService } from './services/user-settings.service';
import { GameTimerService, TimerHandle } from './services/timer.service';
import { cloneDeep } from 'lodash'; // or use a manual clone
import { Settings } from './models/settings';
import { DialogComponent } from './dialog/dialog.component';
import { ToasterService } from './services/toaster.service';
import { ToasterComponent } from './toaster/toaster.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, DialogComponent, ToasterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit {
  //#region Properties           //    //    //    //    //    //    //

  /** possible combinations of 2, 6 sided, dice > 2-12 */
  public numberRange = Array.from({ length: 11 }, (_, i) => i + 2);
  public diceLeftCol = this.numberRange.filter((_, i) => i % 2 === 0);
  public diceRightCol = this.numberRange.filter((_, i) => i % 2 === 1);
  /** currently selected dice roll */
  public currentDiceRoll = 0;
  /* bars to display how many times a given number was rolled */
  public bars: Array<number> = [];
  /* current game's stats */
  public gameStats: Stats = new Stats();
  /* tournament's stats (combined stats from all games since page refresh)*/
  public tourneyStats: Stats = new Stats(); 
  /* history of all completed games */
  public gameHistory: Stats[] = [];

  /* temp variable for swapping game, tourney, and history display */
  private saveStats: Stats = new Stats();

  /** toggle between game info and trounrament info */
  public showingTournament = false;

  /** used to ignore the next mouse click : shouldn't be necessary, need to review this */
  private skipNext = false;

  /* solid square (black square) */
  public rollHistoryHit = "&#9632;";
  /* empty square (white square) */
  public rollHistoryMiss = "&#9633;";

  public gameIsPaused = true;

  public gameIsStopped = true;

  public currentRoll: number | null = null;

  public showGameHistory = false;
  public gameHistoryIndex: number = 0;

  public barParentWidth: number = 1;
  
  public showHelpDialog: boolean = true;

  public settings: Settings = new Settings();

  @ViewChildren('bar') barElements!: QueryList<ElementRef>;
  @ViewChildren('overlay') overlayElements!: QueryList<ElementRef>;

  /**
   * max size of the roll history (in em)
   */
  private readonly maxRollHistorySize = 4.5;
   /**
   * display size of the roll history (em)
   */
  public rollHistoryFontSize = this.maxRollHistorySize;

  public showColorHelp = false;
  public showColorSettings = false;
  
  public colorPickerAll = true;
  public colorType = true;

  undoButtonClicked = false;
  pauseDropdownOpen = false;

  /* tracks time spent within a turn */
  private turnTimer!: TimerHandle;
    public turnDurationDisplay: string = '';
  /* tracks time spent within a game */
  private gameTimer!: TimerHandle; 
  /* tracks time spent within a break */
  private breakTimer!: TimerHandle;
    public totalBreakDuration: string = ""; //  total break time for game
  /* tracks total break time for game */
  private breakTotalTimer!: TimerHandle;
  /*  tracks time between breaks */
  private betweenBreaksTimer!: TimerHandle;
    public betweenBreaksDuration: string = "";

  //  dialog popup properties:
  public showDialog = false;
  public dialogTitle = 'Confirm Action';
  public dialogMessage = 'Are you sure you want to proceed?';
  public dialogOkFunction!: () => void;
  //#endregion  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //#region Constructor         //    //    //    //    //    //    //
  constructor(
    private cdr: ChangeDetectorRef,
    private soundService: SoundService,
    private formatService: TimeFormatService,
    public colorService: ColorService,
    public trendService: TrendService,
    private userSettingsService: UserSettingsService,
    private elRef: ElementRef,
    private timerService: GameTimerService,
    private toaster: ToasterService
  ) { }

  ngOnInit() {
    this.initializeTimers();

    const savedSettings = this.userSettingsService.loadSettings();
    if (savedSettings) {
      this.settings = savedSettings;
    } 

    if (this.settings.colorDensityColor) this.colorService.colorDensityColor = this.settings.colorDensityColor;
    else this.settings.colorDensityColor = this.colorService.colorDensityColor;

    if (this.settings.colorGradients) this.colorService.colorGradients = this.settings.colorGradients;
    else this.settings.colorGradients = this.colorService.colorGradients;
    
    // Trigger checkLastUserInteration every 15 minutes
    setInterval(() => this.checkLastUserInteration(), 15 * 60 * 1000);

    this.registerHandleLeftSwipe();
  }

  ngAfterViewInit(): void {
    this.adjustOverlayFontSize();
    this.updateBarParentWidth(); // Measure the parent element after the view is initialized
    
     if(this.isMobile() && !this.isDiceContainerVisible()) {
       this.toggleDiceContainer();  //  show dice
     }
    
    this.cdr.detectChanges(); // Trigger change detection manually
  }

  registerHandleLeftSwipe() {
    //--  handle swipe from left side of screen : if mobile, show dice   --//
    let touchStartX = 0;
    
    window.addEventListener('touchstart', (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    });

    window.addEventListener('touchend', (e: TouchEvent) => {
      const diceVisible = this.isDiceContainerVisible();
      const touchEndX = e.changedTouches[0].clientX;
      // Detect swipe from left edge (start < 30px, swipe right > 50px)
      if (touchStartX < 30 && touchEndX - touchStartX > 50) {
        if (!diceVisible) {
          this.toggleDiceContainer(); //  open dice container if closed
        }
      }
    });
  }

  initializeTimers(): void {  
    this.turnDurationDisplay = this.formatService.defaultEmptyTime;
    this.gameStats.playingDurationDisplay = this.formatService.defaultEmptyTime;
    this.gameStats.breakDurationDisplay = this.formatService.defaultEmptyTime;
    this.betweenBreaksDuration = this.formatService.defaultEmptyTime;
    this.totalBreakDuration = this.formatService.defaultEmptyTime;

    this.tourneyStats.playingDurationDisplay = this.formatService.defaultEmptyTime;
    this.tourneyStats.breakDurationDisplay = this.formatService.defaultEmptyTime;


    this.turnTimer = this.timerService.createTimer();
    this.timerService.getDisplay(this.turnTimer).subscribe(val => this.turnDurationDisplay = val);

    this.gameTimer = this.timerService.createTimer();
    this.timerService.getDisplay(this.gameTimer).subscribe(val => this.gameStats.playingDurationDisplay = val);
    
    this.breakTimer = this.timerService.createTimer();
    this.timerService.getDisplay(this.breakTimer).subscribe(val => this.gameStats.breakDurationDisplay = val);
    
    this.breakTotalTimer = this.timerService.createTimer();
    this.timerService.getDisplay(this.breakTotalTimer).subscribe(val => this.totalBreakDuration = val);
    
    this.betweenBreaksTimer = this.timerService.createTimer();
    this.timerService.getDisplay(this.betweenBreaksTimer).subscribe(val => this.betweenBreaksDuration = val);
  }

  hasNoGameActivity(): boolean {
    return this.rollCount() == 0 && this.gameHistory.length == 0;
  }

  /**
   * determines if the app has been left running for too long and, if so, pauses, then stops the game timers
   */
  checkLastUserInteration(): void {
    if (this.gameIsStopped) return;

    const secondsPerHour = 3600;
    const twoHours = secondsPerHour * 2;
    const halfHour = secondsPerHour / 2;

    const turnDuration = this.secondsFromTimeString(this.turnDurationDisplay);

    //  if paused and break > 2hrs OR turn > 2hrs
    if (this.gameIsPaused || turnDuration >= twoHours) {  //  game paused for over 2 hours > end game
      if (this.secondsFromTimeString(this.gameStats.breakDurationDisplay) >= twoHours || turnDuration >= twoHours) {
        this.warnUser('Game Paused for over 2 hours > ending game @ ' + new Date().toLocaleString());
        this.performEndGame();
      }
      return;
    }

    //  turn has exceeded 30 minutes > pause game
    if (turnDuration >= halfHour) {
        this.warnUser('User turn has lasted over 30 minutes > pausing game @ ' + new Date().toLocaleString());
        this.pauseGame();
    }
  }

  private warnUser(message: string) : void {
    console.warn(message);
    this.toaster.show(message, true);
  }

  isMobile(): boolean {
    return window.innerWidth <= 768 || window.innerHeight <= 600;
  }
  /**
   * Save settings when the user updates them
   */
  saveSettings(): void {
    this.settings.colorDensityColor = this.colorService.colorDensityColor;
    this.settings.colorGradients = this.colorService.colorGradients;

    // Save settings when the user updates them
    this.userSettingsService.saveSettings(this.settings);
  }

  /**
   * Adjust the font size of the overlay so it fits within the bar
   */
  adjustOverlayFontSize(): void {    
    if(this.isMobile()) this.rollHistoryFontSize = 3; //  start smaller for mobile

    const bar = this.barElements.toArray()[0].nativeElement;
    const overlayElement = this.overlayElements.toArray()[0].nativeElement;

    const tolerance = 2; // Allowable difference in pixels between overlayHeight and barHeight
    const minFontSize = 1.5; // Minimum font size in em when wrapping is detected
    // const maxFontSize = this.maxRollHistorySize; // Maximum font size in em

    const adjust = () => {
      const overlayHeight = overlayElement.offsetHeight;
      const barHeight = bar.offsetHeight;
      
      // Detect wrapping: if overlay height exceeds bar height
      if (overlayHeight > barHeight + tolerance) {
        if (this.rollHistoryFontSize > 3) {
          this.rollHistoryFontSize = 3; // Set font size to 3
        } else if (this.rollHistoryFontSize > 2) {
          this.rollHistoryFontSize = 2; // Set font size to 2
        } else if (this.rollHistoryFontSize > minFontSize) {
          this.rollHistoryFontSize = minFontSize; // Set font size to 1
        }
        overlayElement.style.fontSize = `${this.rollHistoryFontSize}em`;
        return; // Stop further adjustments
      }
    };

    // Delay the adjustment to ensure the DOM is fully updated
    setTimeout(() => {
      const overlayHeight = overlayElement.offsetHeight;
      const barHeight = bar.offsetHeight;

      // Only start the adjustment loop if wrapping is detected
      if (overlayHeight > barHeight + tolerance) {
        requestAnimationFrame(adjust);
      }
    }, 100); // Initial delay of 100ms to allow wrapping to settle
  }

  //#endregion
  //#region Main Game Events      //    //    //    //    //    //    //

  /**
   * clear everything and start over
   */
  public endGame() {
    this.dialogTitle = "End Game?";
    this.dialogMessage = 'Are you sure you want to end the game?';
    this.dialogOkFunction = () => this.performEndGame();
    this.showDialog = true;
  }

  private performEndGame() {
    this.showDialog = false;
    this.closeTournamentDisplay(); //  close tournament display if open

    this.gameIsStopped = true;

    this.currentDiceRoll = 0;

    // stop applicable timers (rest happens @ startResumeGame)
    this.timerService.stop(this.turnTimer);
    this.timerService.stop(this.gameTimer);
    this.timerService.stop(this.breakTimer);
    this.timerService.stop(this.betweenBreaksTimer);
    this.timerService.stop(this.breakTotalTimer);

    this.gameStats.breakDurationDisplay = this.totalBreakDuration;  //  save the total break time for this game (during game it only monitors time during a break)
    this.totalBreakDuration = this.formatService.defaultEmptyTime; // reset for next game
    
    //  save the current game stats to history
    if (this.gameStats.rollHistory.length > 0) {
      this.gameHistory.push(cloneDeep(this.gameStats));
      this.gameHistoryIndex = this.gameHistory.length - 1; //  set to the last index (current game)
      this.showGameHistory = true;
    }

    this.calcTournamentDurations();
    
    this.updateDisplay();

    if (this.isDiceContainerVisible()) this.toggleDiceContainer(); //  close dice container if open

    //  after the user clicks a button, the button retains focus.  
    // Then, when they try to enter the next roll, the enter key event is sent to the button, instead of our function
    // this.setDocumentFocus();
  }

  /**
   * ensure that the tournament stats are updated
   */
  calcTournamentDurations(): void {
    let totalPlay = '0:00:00';
    let totalBreak = '0:00:00';

    for (const stats of this.gameHistory) {
      totalPlay = this.addTimeStrings(totalPlay, stats.playingDurationDisplay || '0:00:00');
      totalBreak = this.addTimeStrings(totalBreak, stats.breakDurationDisplay || '0:00:00');
    }

    this.tourneyStats.breakDurationDisplay = totalBreak;
    this.tourneyStats.playingDurationDisplay = totalPlay;
  }

  /**
   * add two time strings together : format hh:mm:ss or mm:ss
   * @param time1 
   * @param time2 
   * @returns 
   */
  addTimeStrings(time1: string, time2: string): string {
    function toTimeString(totalSeconds: number): string {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    const sumSeconds = this.secondsFromTimeString(time1) + this.secondsFromTimeString(time2);
    var result = toTimeString(sumSeconds);

    return result;
  }

  secondsFromTimeString(time: string): number {
    const parts = time.split(':').map(Number);
    if (parts.length === 2) parts.unshift(0); // If format is mm:ss
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }

  public pauseGame(): void {
    this.currentRoll = null;  //  remove current roll from display

    if (this.gameIsStopped) {
      this.startResumeGame();
      return; //  if game is stopped, just start/resume the game
    }

    this.gameIsPaused = !this.gameIsPaused;

    if (this.gameIsPaused) { //  Pause the game
      this.timerService.stop(this.turnTimer);
      this.timerService.stop(this.gameTimer);
      this.timerService.reset(this.betweenBreaksTimer);

      if(!this.gameIsStopped) {
        this.timerService.start(this.breakTimer);
        this.timerService.start(this.breakTotalTimer);
      }
    } else {  //  Resume the game
      this.timerService.reset(this.turnTimer);
      this.timerService.start(this.turnTimer);
      this.timerService.start(this.gameTimer);
      this.timerService.reset(this.breakTimer);
      this.timerService.stop(this.breakTotalTimer);
      this.timerService.start(this.betweenBreaksTimer);
    }

    // this.setDocumentFocus();
  }

  public startResumeGame(): void {
    this.closeTournamentDisplay(); //  close tournament display if open

    this.gameIsPaused = false;
    this.currentRoll = null;  //  remove current roll from display
    this.showGameHistory = false;

    
    //  reset to zeros for next game
    this.gameStats = new Stats();
    this.timerService.reset(this.turnTimer);
    this.timerService.reset(this.breakTimer);
    this.timerService.reset(this.betweenBreaksTimer);    
    this.timerService.reset(this.breakTotalTimer);
    this.timerService.start(this.turnTimer);
    
    if (this.gameIsStopped) {  //  starting a new game
      this.timerService.start(this.betweenBreaksTimer);
      this.rollHistoryFontSize = this.maxRollHistorySize;
      this.gameStats = new Stats();
      this.gameStats.breakDurationDisplay = this.formatService.defaultEmptyTime;
      this.gameStats.playingDurationDisplay = this.formatService.defaultEmptyTime;

      this.gameIsStopped = false;

      this.colorService.clearMappedColors();
      
      // this.setDocumentFocus();
    }

    //  restart the game timer
    this.timerService.reset(this.gameTimer);
    this.timerService.start(this.gameTimer);

    this.updateDisplay();
  }

  /**
   * determines if the color option is set to 'Density'
   * @returns 
   */
  public colorSyleChoiceIsDensity() {
    return this.settings.colorOption === ColorOption.Density
  }
  /**
   * determines if the color option is set to 'Color'
   * @returns 
   */
  public colorSyleChoiceIsColor() {
    return this.settings.colorOption === ColorOption.Color;
  }
  //#endregion
  //#region Document events       //    //    //    //    //    //    //
  animateClick(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('animated-click');
    // Force reflow to restart the animation
    void target.offsetWidth;
    target.classList.add('animated-click');
  }
  /**
   * set focus to the document so a button does not have the focus, and thus process the enter key (we use for die count entry)
   */
  // setDocumentFocus(): void {
  //   const activeElement = document.activeElement as HTMLElement; // Type assertion
  //   activeElement?.blur(); // Call blur() safely
  // }

  /**
   * track window resize so we can track the bar parent's width
   * @param event 
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.updateBarParentWidth();
    //  don't do this on resize : need to fix algorithm     this.adjustOverlayFontSize();
  }

  /**
   * update the bar parent width (used for calculating bar lengths)
   */
  private updateBarParentWidth(): void {
    const parentElement = document.querySelector('.bar-container');
    if (parentElement) {
      this.barParentWidth = parentElement.clientWidth;
    }
  }

  /**
   * monitor for mouse clicks
   * @param event 
   * @returns 
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.skipNext) {
      this.skipNext = false;
      return;
    }

    this.currentRoll = null; //  reset current roll value

    if(this.hasNoGameActivity()) return;

    const diceContainer = this.elRef.nativeElement.querySelector('.dice-container');
    const dialog = this.elRef.nativeElement.querySelector('app-dialog');

    const clickOnDiceContainer = diceContainer && diceContainer.contains(event.target as Node);
    const clickOnDialog = dialog && dialog.contains(event.target as Node);
    
    if (!clickOnDiceContainer && !clickOnDialog) {
      // Click was outside dice-container
      if (this.isDiceContainerVisible()) this.toggleDiceContainer(); //  close dice container if open
    }
  }

  // monitor keystrokes (die count input, display toggles, etc.)
  @HostListener('document:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    if (event.key == 'Shift' && this.rollCount() > 0) {
      this.toggleDiePercent();
      return;
    }
    if (event.key == 'Control' && this.rollCount() > 0) {
      this.toggleTournamentDisplay();
      return;
    }
    if (event.key == 'F1') {
      event.preventDefault(); // Prevent the default behavior of the key
      this.showHelp();
      return;
    }

    if (event.key == 'Escape' && this.showHelpDialog) {
      if (this.settings.playSounds) this.soundService.playSoundEscape();
      this.showHelpDialog = false; // Close the help dialog
      return;
    }
    else if (event.key == 'Escape') {
      this.currentDiceRoll = 0;
      this.currentRoll = null; //  reset current roll value
      if (this.settings.playSounds) this.soundService.playSoundEscape();
      return;
    }

    if (!this.showingTournament && event.key.includes('Arrow')) {
      //  change the roll history size
      this.rollHistoryFontSize += (event.key == 'ArrowRight' || event.key == 'ArrowUp') ? +0.5 : -0.5;
      if (this.rollHistoryFontSize <= 0) this.rollHistoryFontSize = 0.5;
      if (this.rollHistoryFontSize >= 10) this.rollHistoryFontSize = 10;

      return;
    }

    if (this.gameIsPaused) {
      return;
    }

    this.currentRoll = null; //  reset current roll value
  }

  //#endregion
  //#region Display Updates       //    //    //    //    //    //    //
  private updateDisplay() {
    //update the bar chart data (tracks how many times a number has rolled)
    if(this.gameStats?.rolls) {
      this.numberRange.forEach(num => {
        this.bars[num] = this.gameStats.rolls[num] || 0;
      });
    }
    
    this.mapRollFrequencyColor();
  }

  private mapRollFrequencyColor() {
    this.colorService.mapRollFrequencyColor(this.rollCount(), this.settings.colorOption, this.gameStats, this.maxRollCount()); //  map the roll frequency colors
  }

  updateRollFrequencyColor(index: number, hexColor: string): void {
    this.colorService.updateRollFrequencyColor(index, hexColor); // Update the color for the specific roll
    if (this.rollCount() == 0) this.colorService.showSampleColors(this.settings.colorOption);
    else this.mapRollFrequencyColor();

    this.saveSettings();
  }
  updateRollFrequencyDensityColor(color: string): void {
    this.colorService.updateRollFrequencyDensityColor(color); // Update the color for the specific roll
    if (this.rollCount() == 0) this.colorService.showSampleColors(this.settings.colorOption);
    else this.mapRollFrequencyColor();

    this.saveSettings();
  }

  mapNewColors(lowColor: string, highColor: string): void {
    this.colorService.generateGradient(lowColor, highColor);
    this.colorService.showSampleColors(this.settings.colorOption);
    this.colorPickerAll = true;  //  toggle to show generated colors

    this.saveSettings();
  }

  keyValueNumericOrder(a: KeyValue<string, string>, b: KeyValue<string, string>): number {
    return +b.key - +a.key;
  }


  //#endregion
  //#region Button Events         //    //    //    //    //    //    //
  public resetSettings() {
      this.dialogTitle = "Reset All Settings?";
      this.dialogMessage = 'Are you sure you want to reset all settings to their default values?';
      this.dialogOkFunction = () => this.performSettingsReset();
      this.showDialog = true;
  }
  
  public performSettingsReset() {
    this.showDialog = false;
    this.settings = new Settings(); //  covers all the settings except colors
    this.settings.colorDensityColor = this.colorService.defaultColorDensityColor;
    this.colorService.colorDensityColor = this.settings.colorDensityColor;
    this.settings.colorGradients = this.colorService.defaultColorGradients;
    this.colorService.colorGradients = this.settings.colorGradients;
    this.updateDisplay();
  }
  
  public showHelp() {
    this.showHelpDialog = true;
  }

  public showColorSettingsDialog() {
    if (this.isDiceContainerVisible()) this.toggleDiceContainer();
    if(!this.gameIsPaused && !this.gameIsStopped) this.pauseGame();
    this.showColorHelp = true;
  }
  public closeColorSettingsDialog() {
    this.showColorSettings = false;
    if(!this.gameIsStopped) this.pauseGame();   //  resume the game
  }

  public closeColorHelp() {
    this.showColorHelp = false;
    this.showColorSettings = true;
  }

  previousHistoryGame() {
    if (this.settings.playSounds) this.soundService.playSoundBump();
    this.gameHistoryIndex -= 1;

    if (this.gameHistoryIndex < 0) this.gameHistoryIndex = this.gameHistory.length - 1;

    this.gameStats = this.gameHistory[this.gameHistoryIndex];

    this.updateDisplay();
  }

  nextHistoryGame() {
    if (this.settings.playSounds) this.soundService.playSoundBump();

    this.gameHistoryIndex += 1;

    if (this.gameHistoryIndex >= this.gameHistory.length) this.gameHistoryIndex = 0;

    this.gameStats = this.gameHistory[this.gameHistoryIndex];

    this.updateDisplay();
  }
  //#endregion
  //#region Display Toggles       //    //    //    //    //    //    //
  
  /**
   * User has clicked the 'OK' button on the message dialog
   */

  handleDialogCancel() {
    this.showDialog = false;
  }

  toggleFixedColors() {
    this.settings.fixedColors = !this.settings.fixedColors;
    this.saveSettings();
  }

  togglePauseDropdown() {
    this.pauseDropdownOpen = !this.pauseDropdownOpen;
  }

  closePauseDropdown() {
    this.pauseDropdownOpen = false;
  }

  toggleColorType(): void {
    this.colorType = !this.colorType;
    if (this.settings.playSounds) this.soundService.playSoundBump();

    if (this.settings.colorOption === ColorOption.Density)
      this.settings.colorOption = ColorOption.Color;
    else
      this.settings.colorOption = ColorOption.Density;

    this.saveSettings();
  }
  /**
   * show/hide the dice container (used for mobile devices)
   */
  toggleDiceContainer(): void {
    this.skipNext = true;

    const diceSectionInvisible = !this.isDiceContainerVisible();

    const diceContainer = document.querySelector('.dice-container');
    if (diceContainer) {
      if (diceSectionInvisible) {
        diceContainer.classList.add('visible');
      } else {
        diceContainer.classList.remove('visible');
      }
    } else this.toaster.show('?! cannot find dice container ?!');    
  }

  isDiceContainerVisible(): boolean {
    const diceContainer = document.querySelector('.dice-container');
    return diceContainer ? diceContainer?.classList.contains('visible') : false;
  }

  toggleColorPicker(): void {
    this.colorPickerAll = !this.colorPickerAll;
    if (this.settings.playSounds) this.soundService.playSoundBump();
  }

  closeTournamentDisplay() {
    if (this.showingTournament) this.toggleTournamentDisplay(); //  close tournament display if open
  }

  toggleTournamentDisplay() {
    this.showingTournament = !this.showingTournament;
    if (this.settings.playSounds) this.soundService.playSoundBump();

    if (this.gameIsStopped) { //  game is stopped, so we need to toggle between history and tournament
      if (this.showingTournament) {
        //  switch to the tournament values
        this.gameStats = cloneDeep(this.tourneyStats);
      } else { //if (this.showGameHistory) 
        this.gameStats = cloneDeep(this.gameHistory[this.gameHistoryIndex]);
      } 
    } else {  //  game is in progress, so we need to save the current game values, then toggle between game and tournament
      if (this.showingTournament) {
        //  save the current game values
        this.saveStats = cloneDeep(this.gameStats);
        //  switch to the tournament values
        this.gameStats = cloneDeep(this.tourneyStats);
      } else {
        // reload game values from save
        this.gameStats = cloneDeep(this.saveStats);
      }
    }

    this.updateDisplay();
  }

  toggleDiePercent() {
    if (this.settings.playSounds) this.soundService.playSoundBump();
    this.settings.showDiceCounts = !this.settings.showDiceCounts;
    this.saveSettings();
  }

  //#endregion
  //#region Calculators           //    //    //    //    //    //    //

  /**
   * 
   * @returns Count of total rolls this game
   */
  rollCount() {
    return this.gameStats?.rollHistory?.length ?? 0;
  }

  /**
   * Determines which roll has happened the most in the tournament (used to calculate bar lengths for the red bar).
   * @returns Maximum roll count in the tournament
   */
  maxRollCountTourney(): number {
    return Math.max(...Object.values(this.tourneyStats.rolls));
  }

  /**
   * outputs a list of characters to indicate when, in history, the given number was rolled
   * @param number 
   * @returns Solid Squares & Empty Squares 
   */
  getRollHistory(number: number) {
    let foundChar = this.rollHistoryHit.toUpperCase();
    let missChar = this.rollHistoryMiss.toUpperCase();

    return this.gameStats.rollHistory.map(roll => roll === number ? foundChar : missChar).join('');
  }

  /**
   * determines which roll has happened the most (used to calculate bar lengths in the bar chart)
   * @returns 
   */
  maxRollCount() {
    if(!this.gameStats) return 0; //  no rolls, return 0
    var maxRollCount = Math.max(...Object.values(this.gameStats.rolls));
    return maxRollCount;
  }

  /**
   * calculates how often the given number rolls
   * @returns 
   */
  calculateAverageInterval(dieNumber: number) {
    if(this.gameStats.rollHistory.length === 0) return 0; //  no rolls, return 0

    let indices: number[] = []; // Array to store indices where dieNumber occurs

    // Find indices where dieNumber is rolled
    this.gameStats.rollHistory.forEach((key, index) => {
      if (key === dieNumber) {
        indices.push(index);
      }
    });

    // If no occurrences of dieNumber, return total length of rollHistory
    if (indices.length === 0) {
      return this.gameStats.rollHistory.length; // Entire roll history since no dieNumbers were rolled
    }

    return (this.gameStats.rollHistory.length / indices.length).toFixed(1);
  }

  /**
   * % this # has rolled
   * @param num 
   * @returns 
   */
  getBarPercent(num: number, decimalPlaces: number): string {
    if (!this.bars[num] || this.bars[num] <= 0) return '0.0';

    const perc = (this.bars[num] / this.rollCount()) * 100; // % of total rolls

    const result = perc.toFixed(decimalPlaces); //  return as decimal (1 decimal place)
    return result;
  }

  getTourneyBarPercent(num: number): number {
    var val = this.tourneyStats.rolls[num] || 0;

    const perc = (val / this.tourneyStats.rollHistory.length) * 100; // % of total rolls

    return Math.trunc(perc);
  }

  /**
   * Set the roll frequency color option 
   * @param option 'density' or 'color'
   */
  setColorOption(option: ColorOption): void {
    this.settings.colorOption = option;
    this.mapRollFrequencyColor();

    this.userSettingsService.saveSettings(this.settings);
  }

  toggleSounds(): void {
    this.settings.playSounds = !this.settings.playSounds;
    if (this.settings.playSounds) this.soundService.playSoundBump();
    else this.soundService.playSoundEscape();

    this.saveSettings(); // Save the updated settings
  }

  //#endregion
  //#region Dice                  //    //    //    //    //    //    //

  /**
   * A Dice roll has been selected
   * @param diceRoll 
   */
  selectDiceRoll(diceRoll: number) {
    if (this.settings.playSounds) this.soundService.playSoundNumberSelect();
    this.currentDiceRoll = diceRoll;

    this.storeValues();
  }

  /**
   * store/save the selected dice values (and update history etc.)
   */
  storeValues() {
    //  if valid entry, process the selections...
    if ((this.currentDiceRoll > 0)) {
      this.currentRoll = this.currentDiceRoll;

      this.gameStats.rolls[this.currentRoll] = (this.gameStats.rolls[this.currentRoll] || 0) + 1;
      this.tourneyStats.rolls[this.currentRoll] = (this.tourneyStats.rolls[this.currentRoll] || 0) + 1;

      this.gameStats.rollHistory.push(this.currentRoll);
      this.tourneyStats.rollHistory.push(this.currentRoll);

      if (this.settings.playSounds) {
        if (this.currentRoll == 7) this.soundService.playSoundSeven();
        else this.soundService.playSoundSuccess();
      }
    } else if (this.settings.playSounds) this.soundService.playSoundFailure();

    this.updateDisplay();

    this.adjustOverlayFontSize()

    //  turn ended / next turn begins
    this.timerService.reset(this.turnTimer);
    this.timerService.start(this.turnTimer);
  }

  undoLastRoll() {
    // Add the clicked class for animation
    this.undoButtonClicked = true;

    // if (this.gameStats.rollHistory.length > 0) {
    //   this.dialogTitle = "Undo Last Roll?";
    //   this.dialogMessage = 'Are you sure you want to undo the last roll?';
    //   this.dialogOkFunction = () => this.performRollUndo();
    //   this.showDialog = true;
    // }
    this.performRollUndo();
    

    setTimeout(() => {
      this.undoButtonClicked = false;
    }, 250);
  }

  performRollUndo() {
    this.showDialog = false;
    const lastRoll = this.gameStats.rollHistory[this.gameStats.rollHistory.length - 1]; // Get the last roll

    this.gameStats.rollHistory.pop(); // Remove the last roll from the game history
    this.tourneyStats.rollHistory.pop(); // Remove the last roll from the tournament history

    this.gameStats.rolls[lastRoll] = (this.gameStats.rolls[lastRoll] || 0) - 1; // Decrease the count for that roll
    this.tourneyStats.rolls[lastRoll] = (this.tourneyStats.rolls[lastRoll] || 0) - 1; // Decrease the count for that roll

    this.updateDisplay();
  }

  //#endregion

}
