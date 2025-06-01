declare var webkitSpeechRecognition: any;

import { Component, HostListener, OnInit, AfterViewInit, ChangeDetectorRef, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule, KeyValue } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayStats } from './gameStats';
import { SoundService } from './sound.service';
import { TimeFormatService } from './time-format.service'; // Add this line
import { ColorOption } from './color-option.enum'; // Import the enum
import { ColorService } from './color.service';
import { TrendService } from './trend.service';
import { UserSettingsService } from './user-settings.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit {
  //#region Properties           //    //    //    //    //    //    //

  /** number of sides per die */
  public dice = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  public diceCol1 = this.dice.filter((_, i) => i % 2 === 0); // left column
  public diceCol2 = this.dice.filter((_, i) => i % 2 === 1); // right column

  /** possible combinations of 2, 6 sided, dice > 2-12 */
  public numberRange = Array.from({ length: 11 }, (_, i) => i + 2);

  /** the selections for the two dice */
  public selectedDie = 0;
  public bars: Array<number> = [];  //  bars to display how many times a given number was rolled

  public gameStats: PlayStats = new PlayStats();     //  game stats
  public tourneyStats: PlayStats = new PlayStats();  //  tournament stats

  public gameHistory: PlayStats[] = []; //  game history object

  // temp variable for swapping game, tourney, and history display
  private saveStats: PlayStats = new PlayStats();

  /** tracks the person's turn duration */
  public turnDurationDisplay: string = '';
  private turnIntervalId: any;
  private turnStartTime: number | null = null;

  /** tracks game duration */
  private gameIntervalId: any;
  private gameStartTime: number | null = null;

  /** toggle between game info and trounrament info */
  public showingTournament = false;

  /** tracks trournament duration (incl. breaks) */
  private tournamentSeconds = 0;
  private tournamentBreakSeconds: number = 0;

  /** tracks the total time spent on break */
  public breakDurationDisplay: string = '';
  private breakIntervalId: any;
  private gameBreakSeconds = 0;
  private gameBreakTotalSeconds = 0;

  /** used to ignore the next mouse click */
  private skipNext = false;

  public rollHistoryHit = "&#9632;";      //  solid square (black square)
  public rollHistoryMiss = "&#9633;";   //  empty square (white square)

  /**
   * toggle between showing die counts and percentages
   */
  public showDieCounts = true;

  /** pause the game */
  public showGamePause = true;

  /** store duration while paused */
  private savedGameDuration = 0;

  /** when 'new game' is clicked */
  public gameIsStopped = true;

  public currentRoll: number | null = null; //  current roll value (sum of the two dice)

  //  variables for 'game history' display
  public showGameHistory = false;
  public gameHistoryIndex: number = 0;

  public isDiceContainerVisible: boolean = true;

  public barParentWidth: number = 1; // Default value to prevent division by zero

  public showHelpDialog: boolean = true; // Flag to control the visibility of the help popup

  public ColorOption = ColorOption; // Expose the enum to the template
  public userSettings: any = {
    playSounds: true,
    showTooltips: true,
    colorOption: ColorOption.Density,
    colorDensityColor: "",
    colorGradients: []
  };

  @ViewChildren('bar') barElements!: QueryList<ElementRef>;
  @ViewChildren('overlay') overlayElements!: QueryList<ElementRef>;

  /**
   * display size of the roll history (em)
   */
  private readonly maxRollHistorySize = 5; //  max size of the roll history (in em)
  public rollHistoryFontSize = this.maxRollHistorySize;
  // showColorPickerColors = false; // Flag to control the visibility of the color picker
  colorPickerAll = true; // Flag to control the visibility of the color picker
  colorType = true;

  showColorSettings = false;

  public blockScreenOpacity: number = 0.7; // Default opacity (0 to 1)

  public showColorHelp = false;

  //#endregion  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //#region Constructor         //    //    //    //    //    //    //
  constructor(
    private cdr: ChangeDetectorRef,
    private soundService: SoundService,
    private formatService: TimeFormatService,
    public colorService: ColorService,
    public trendService: TrendService,
    private userSettingsService: UserSettingsService,
    private elRef: ElementRef
  ) { }

  ngOnInit() {
    this.gameStats.breakDurationDisplay = this.formatService.defaultEmptyTime;
    this.gameStats.playingDurationDisplay = this.formatService.defaultEmptyTime;

    this.endGame();

    const savedSettings = this.userSettingsService.loadSettings();

    if (savedSettings) {
      this.userSettings = savedSettings;
    }

    if (this.userSettings.colorDensityColor) this.colorService.colorDensityColor = this.userSettings.colorDensityColor;
    else this.userSettings.colorDensityColor = this.colorService.colorDensityColor;

    if (this.userSettings.colorGradients) this.colorService.colorGradients = this.userSettings.colorGradients;
    else this.userSettings.colorGradients = this.colorService.colorGradients;
  }

  ngAfterViewInit(): void {
    this.adjustOverlayFontSize();
    this.updateBarParentWidth(); // Measure the parent element after the view is initialized
    this.cdr.detectChanges(); // Trigger change detection manually
  }

  /**
   * Save settings when the user updates them
   */
  saveSettings(): void {
    this.userSettings.colorDensityColor = this.colorService.colorDensityColor;
    this.userSettings.colorGradients = this.colorService.colorGradients;

    // Save settings when the user updates them
    this.userSettingsService.saveSettings(this.userSettings);
  }

  /**
   * Adjust the font size of the overlay so it fits within the bar
   */
  adjustOverlayFontSize(): void {
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
    if (this.rollCount() > 0) {
      if (confirm('are you sure you want to end the game?') == false) {
        return;
      }
    }

    this.closeTournamentDisplay(); //  close tournament display if open

    this.gameIsStopped = true;

    //  save the current game stats to history
    if (this.gameStats.rollHistory.length > 0) {
      this.gameHistory.push(this.gameStats);
      this.gameHistoryIndex = this.gameHistory.length - 1; //  set to the last index (current game)
      this.gameStats = this.gameHistory[this.gameHistoryIndex]; //  set to this game (from history)
      this.showGameHistory = true;
    }

    this.selectedDie = 0;

    this.stopTurnTimer();

    this.pauseGame();

    this.updateDisplay();

    //  after the user clicks a button, the button retains focus.  
    // Then, when they try to enter the next roll, the enter key event is sent to the button, instead of our function
    this.setDocumentFocus();
  }

  public pauseGame(): void {
    if (this.isDiceContainerVisible) this.toggleDiceContainer(); //  close dice container if open
    this.currentRoll = null;  //  remove current roll from display

    if (!this.gameIsStopped) {
      //  start break timer
      if (!this.breakIntervalId) { // Prevent multiple intervals from being created
        this.breakIntervalId = setInterval(() => {
          this.updateGameBreak(1);
          this.updateGameBreakTotal(1);
          this.updateTournamentBreakDuration(1);
        }, 1000); // Update every second
      }
    }

    this.stopTurnTimer();
    if (this.gameStartTime !== null) {
      this.savedGameDuration += this.formatService.calculateDuration(this.gameStartTime, Date.now());
    }

    this.showGamePause = true;
    clearInterval(this.gameIntervalId);
    this.gameIntervalId = null; // Reset the interval tracker
  }

  public startResumeGame(): void {
    this.closeTournamentDisplay(); //  close tournament display if open

    this.showGamePause = false;
    this.currentRoll = null;  //  remove current roll from display
    this.showGameHistory = false;

    this.stopBreakTimer();
    this.startTurnTimer();
    this.updateTurnDuration();

    if (this.gameIsStopped) {  //  starting a new game
      this.rollHistoryFontSize = this.maxRollHistorySize;
      this.gameStats = new PlayStats();
      this.gameStats.breakDurationDisplay = this.formatService.defaultEmptyTime;
      this.gameStats.playingDurationDisplay = this.formatService.defaultEmptyTime;

      if (this.tourneyStats.rollHistory.length == 0) { //  no history, so init
        this.tourneyStats = new PlayStats();
        this.tourneyStats.breakDurationDisplay = this.formatService.defaultEmptyTime;
        this.tourneyStats.playingDurationDisplay = this.formatService.defaultEmptyTime;
      }

      this.savedGameDuration = 0;
      this.gameIsStopped = false;

      this.updateGameBreakTotal(0);

      this.colorService.clearMappedColors();
    }

    //  restart the game timer (we saved off the duration @ pause)
    if (!this.gameIntervalId) { // It should be null >> Prevent multiple intervals from being created
      this.gameStartTime = Date.now();
      this.updateGameDuration();  //  to show zeros @ start
      this.gameIntervalId = setInterval(() => {
        this.incrementTournamentDuration();
        this.updateGameDuration();
      }, 1000); // Update every second
    }

    this.updateDisplay();
  }

  //#endregion
  //#region Document events       //    //    //    //    //    //    //

  /**
   * set focus to the document so a button does not have the focus, and thus process the enter key (we use for die count entry)
   */
  setDocumentFocus(): void {
    const activeElement = document.activeElement as HTMLElement; // Type assertion
    activeElement?.blur(); // Call blur() safely
  }

  /**
   * track window resize so we can track the bar parent's width
   * @param event 
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.updateBarParentWidth();
    this.adjustOverlayFontSize();
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
    this.showHelpDialog = false;

    if (this.skipNext) {
      this.skipNext = false;
      return;
    }

    if (this.showColorHelp) this.closeColorHelp();

    if (!this.gameIsStopped && !this.showGamePause) {
      const diceContainer = this.elRef.nativeElement.querySelector('.dice-container');
      if (diceContainer && !diceContainer.contains(event.target as Node)) {
        this.currentRoll = null; //  reset current roll value
        // Click was outside dice-container
        if (this.isDiceContainerVisible) this.toggleDiceContainer(); //  close dice container if open
      }
    }
  }

  @HostListener('window:wheel', ['$event'])
  onScroll(event: WheelEvent): void {
    if (this.showGamePause && !this.showHelpDialog) {  //  if game is paused, change opacity of the overlay
      if (event.deltaY > 0) { //  Scrolled down
        this.blockScreenOpacity += 0.1;
        if (this.blockScreenOpacity >= 1) this.blockScreenOpacity = 1;
      } else {  //  Scrolled up
        if (this.showGamePause) {  //  if game is paused, change opacity of the overlay
          this.blockScreenOpacity -= 0.1;
          if (this.blockScreenOpacity <= 0) this.blockScreenOpacity = 0;
        }
      }
    }
  }

  // monitor keystrokes (die count input, display toggles, etc.)
  @HostListener('document:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    //console.log(`key down : '${event.key}'`);

    if (event.key == 'Shift') {
      this.toggleDiePercent();
      return;
    }
    if (event.key == 'Control') {
      this.toggleTournamentDisplay();
      return;
    }
    if (event.key == 'F1') {
      event.preventDefault(); // Prevent the default behavior of the key
      this.showHelp();
      return;
    }

    if (event.key == 'Escape' && this.showHelpDialog) {
      if (this.userSettings.playSounds) this.soundService.playSoundEscape();
      this.showHelpDialog = false; // Close the help dialog
      return;
    }
    else if (event.key == 'Escape') {
      this.selectedDie = 0;
      this.currentRoll = null; //  reset current roll value
      if (this.userSettings.playSounds) this.soundService.playSoundEscape();
      return;
    }

    if (!this.showingTournament && event.key.includes('Arrow')) {
      // if (this.showGameHistory) {
      //   this.gameHistoryIndex += (event.key == 'ArrowRight' || event.key == 'ArrowUp') ? +1 : -1;
      //   if (this.gameHistoryIndex >= this.gameHistory.length) this.gameHistoryIndex = 0;
      //   if (this.gameHistoryIndex < 0) this.gameHistoryIndex = this.gameHistory.length - 1;

      //   this.gameStats = this.gameHistory[this.gameHistoryIndex];

      //   this.updateDisplay();
      // } else {  //  change the roll history size
      this.rollHistoryFontSize += (event.key == 'ArrowRight' || event.key == 'ArrowUp') ? +0.5 : -0.5;
      if (this.rollHistoryFontSize <= 0) this.rollHistoryFontSize = 0.5;
      if (this.rollHistoryFontSize >= 10) this.rollHistoryFontSize = 10;
      // }

      return;
    }

    if (this.showGamePause) {
      return;
    }

    this.currentRoll = null; //  reset current roll value
  }

  //#endregion
  //#region Display Updates       //    //    //    //    //    //    //

  private updateGameBreak(setValue: number) {
    if (setValue == 0) this.gameBreakSeconds = 0;
    else this.gameBreakSeconds += setValue;

    if (this.gameBreakSeconds > 0) {
      this.breakDurationDisplay = this.formatService.formatDuration(this.gameBreakSeconds);
    }
    else this.breakDurationDisplay = this.formatService.defaultEmptyTime;
  }

  private updateGameBreakTotal(setValue: number) {
    if (setValue == 0) this.gameBreakTotalSeconds = 0;
    else this.gameBreakTotalSeconds += setValue;

    if (this.gameBreakTotalSeconds > 0) {
      this.gameStats.breakDurationDisplay = this.formatService.formatDuration(this.gameBreakTotalSeconds);
    }
    else this.gameStats.breakDurationDisplay = this.formatService.defaultEmptyTime;
  }

  private updateTournamentBreakDuration(setValue: number) {
    if (setValue == 0) this.tournamentBreakSeconds = 0;
    else this.tournamentBreakSeconds += setValue;

    if (this.tournamentBreakSeconds > 0) {
      this.tourneyStats.breakDurationDisplay = this.formatService.formatDuration(this.tournamentBreakSeconds);
    }
    else this.tourneyStats.breakDurationDisplay = this.formatService.defaultEmptyTime;
  }

  private incrementTournamentDuration() {
    this.tournamentSeconds = this.tournamentSeconds + 1;

    this.tourneyStats.playingDurationDisplay = this.formatService.formatDuration(this.tournamentSeconds);
  }

  private updateGameDuration() {
    if (this.gameStartTime !== null) {
      this.gameStats.playingDurationDisplay = this.formatService.calcAndFormatDuration(this.gameStartTime, Date.now(), this.savedGameDuration);
    }
    else this.gameStats.playingDurationDisplay = this.formatService.defaultEmptyTime;
  }

  private updateTurnDuration() {
    if (this.turnStartTime !== null) {
      this.turnDurationDisplay = this.formatService.calcAndFormatDuration(this.turnStartTime, Date.now());
    }
    else this.turnDurationDisplay = this.formatService.defaultEmptyTime;
  }

  private updateDisplay() {
    this.updateBars();
    this.mapRollFrequencyColor();
  }

  private mapRollFrequencyColor() {
    this.colorService.mapRollFrequencyColor(this.rollCount(), this.userSettings.colorOption, this.gameStats, this.maxRollCount()); //  map the roll frequency colors
  }

  updateRollFrequencyColor(index: number, hexColor: string): void {
    this.colorService.updateRollFrequencyColor(index, hexColor); // Update the color for the specific roll
    if (this.rollCount() == 0) this.colorService.showSampleColors(this.userSettings.colorOption);
    else this.mapRollFrequencyColor();

    this.saveSettings();
  }
  updateRollFrequencyDensityColor(color: string): void {
    this.colorService.updateRollFrequencyDensityColor(color); // Update the color for the specific roll
    if (this.rollCount() == 0) this.colorService.showSampleColors(this.userSettings.colorOption);
    else this.mapRollFrequencyColor();

    this.saveSettings();
  }

  mapNewColors(lowColor: string, highColor: string): void {
    this.colorService.generateGradient(lowColor, highColor);
    this.colorService.showSampleColors(this.userSettings.colorOption);
    this.colorPickerAll = true;  //  toggle to show generated colors

    this.saveSettings();
  }

  keyValueNumericOrder(a: KeyValue<string, string>, b: KeyValue<string, string>): number {
    return +b.key - +a.key;
  }

  /**
   * update the bar chart data (tracks how many times a number has rolled)
   */
  updateBars() {
    this.numberRange.forEach(num => {
      this.bars[num] = this.gameStats.rolls[num] || 0;
    });
  }

  //#endregion
  //#region Button Events         //    //    //    //    //    //    //
  public showHelp() {
    this.showHelpDialog = true;
  }

  public showColorSettingsDialog() {
    if (this.isDiceContainerVisible) this.toggleDiceContainer();
    this.pauseGame();
    this.showColorHelp = true;
    this.skipNext = true;
  }
  public closeColorSettingsDialog() {
    this.showColorSettings = false;
    this.startResumeGame();
  }

  public closeColorHelp() {
    this.showColorHelp = false;
    this.showColorSettings = true;
  }
  /** prevent barbarian and knight buttons from triggering (so we can handle it) */
  ignoreEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent the default behavior of the Enter key
    }
  }

  previousHistoryGame() {
    if (this.userSettings.playSounds) this.soundService.playSoundBump();
    this.gameHistoryIndex -= 1;

    if (this.gameHistoryIndex < 0) this.gameHistoryIndex = this.gameHistory.length - 1;

    this.gameStats = this.gameHistory[this.gameHistoryIndex];

    this.updateDisplay();
  }

  nextHistoryGame() {
    if (this.userSettings.playSounds) this.soundService.playSoundBump();

    this.gameHistoryIndex += 1;

    if (this.gameHistoryIndex >= this.gameHistory.length) this.gameHistoryIndex = 0;

    this.gameStats = this.gameHistory[this.gameHistoryIndex];

    this.updateDisplay();
  }
  //#endregion
  //#region Display Toggles       //    //    //    //    //    //    //
  // showColorPicker(): void {
  //   this.showColorPickerColors = !this.showColorPickerColors;

  //   if(this.showColorPickerColors) {
  //       this.colorService.showSampleColors(this.userSettings.colorOption);
  //   } else {
  //     this.updateDisplay();
  //   }
  // }

  toggleColorType(): void {
    this.colorType = !this.colorType;
    if (this.userSettings.playSounds) this.soundService.playSoundBump();

    if (this.userSettings.colorOption === ColorOption.Density)
      this.userSettings.colorOption = ColorOption.Color;
    else
      this.userSettings.colorOption = ColorOption.Density;

    this.saveSettings();
  }
  /**
   * show/hide the dice container (used for mobile devices)
   */
  toggleDiceContainer(): void {
    this.skipNext = true;
    this.isDiceContainerVisible = !this.isDiceContainerVisible;
    const diceContainer = document.querySelector('.dice-container');
    if (diceContainer) {
      if (this.isDiceContainerVisible) {
        diceContainer.classList.add('visible');
      } else {
        diceContainer.classList.remove('visible');
      }
    }
  }

  toggleColorPicker(): void {
    this.colorPickerAll = !this.colorPickerAll;
    if (this.userSettings.playSounds) this.soundService.playSoundBump();
  }

  closeTournamentDisplay() {
    if (this.showingTournament) this.toggleTournamentDisplay(); //  close tournament display if open
  }
  toggleTournamentDisplay() {
    this.showingTournament = !this.showingTournament;
    if (this.userSettings.playSounds) this.soundService.playSoundBump();

    if (this.gameIsStopped) { //  game is stopped, so we need to toggle between history and tournament
      if (this.showingTournament) {
        this.gameStats = this.tourneyStats;
      } else {
        this.gameStats = this.gameHistory[this.gameHistoryIndex];
      }
    } else {  //  game is in progress, so we need to save the current game values, then toggle between game and tournament
      if (this.showingTournament) {
        //  save the current game values
        this.saveStats = this.gameStats;
        //  switch to the tournament values
        this.gameStats = this.tourneyStats;
      } else {
        // reload game values from save
        this.gameStats = this.saveStats;
      }
    }

    this.updateDisplay();
  }

  toggleDiePercent() {
    if (this.userSettings.playSounds) this.soundService.playSoundBump();
    this.showDieCounts = !this.showDieCounts;
  }

  toggleGameHistory() {
    if (this.gameHistory.length <= 0) {
      this.showGameHistory = false;
      return; //  no history to show
    }

    this.showGameHistory = !this.showGameHistory;
    this.gameHistoryIndex = 0;

    if (this.showGameHistory) {
      this.saveStats = this.gameStats; //  shouldn't be necessary, but just in case
      this.gameStats = this.gameHistory[this.gameHistoryIndex];
    }
    else {
      this.gameStats = this.saveStats;
    }

    this.updateDisplay();
  }

  //#endregion
  //#region Calculators           //    //    //    //    //    //    //

  /**
   * 
   * @returns Count of total rolls this game
   */
  rollCount() {
    return this.gameStats.rollHistory.length;
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

    const joinChar = '';

    return this.gameStats.rollHistory.map(roll => roll === number ? foundChar : missChar).join(joinChar);
  }

  /**
   * determines which roll has happened the most (used to calculate bar lengths in the bar chart)
   * @returns 
   */
  maxRollCount() {
    var maxRollCount = Math.max(...Object.values(this.gameStats.rolls));
    return maxRollCount;
  }

  /**
   * calculates how often the given number rolls
   * @returns 
   */
  calculateAverageInterval(dieNumber: number) {
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
  getBarPercent(num: number): number {
    if (this.bars[num] <= 0) return 0;

    const perc = (this.bars[num] / this.rollCount()) * 100; // % of total rolls

    return Math.trunc(perc);
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
    this.userSettings.colorOption = option;
    this.mapRollFrequencyColor();

    this.userSettingsService.saveSettings(this.userSettings);
  }

  toggleSounds(): void {
    this.userSettings.playSounds = !this.userSettings.playSounds;
    if (this.userSettings.playSounds) this.soundService.playSoundBump();
    else this.soundService.playSoundEscape();

    this.saveSettings(); // Save the updated settings
  }

  //#endregion
  //#region Timers                //    //    //    //    //    //    //

  /**
   * Start the turn timer
   */
  startTurnTimer(): void {
    if (!this.turnIntervalId) { // Prevent multiple intervals from being created
      this.turnStartTime = Date.now();
      this.turnIntervalId = setInterval(() => {
        this.updateTurnDuration();
      }, 1000); // Update every second
    }
  }

  /**
   * stop the turn timer
   */
  stopTurnTimer(): void {
    clearInterval(this.turnIntervalId);
    this.turnIntervalId = null; // Reset the interval tracker
  }

  private stopBreakTimer() {
    clearInterval(this.breakIntervalId);
    this.breakIntervalId = null; // Reset the interval tracker

    this.updateGameBreak(0);
  }

  //#endregion
  //#region Dice                  //    //    //    //    //    //    //

  /**
   * A Die has been selected
   * @param column 
   * @param value 
   */
  selectDiceRoll(value: number) {  //  column: number, 
    this.skipNext = true; //  skip the next click event (to prevent closing the dice container)
    this.selectedDie = value;
    if (this.userSettings.playSounds) this.soundService.playSoundNumberSelect();
    this.currentRoll = null; //  reset current roll value
    // if(event) event.preventDefault(); // Prevent the default browser context menu
    this.storeValues();
  }

  /**
   * store/save the selected dice values (and update history etc.)
   */
  storeValues() {
    //  if valid entry, process the selections...
    if ((this.selectedDie > 0)) {
      if (this.isDiceContainerVisible) this.toggleDiceContainer(); //  close dice container if open
      this.currentRoll = this.selectedDie;

      this.gameStats.rolls[this.currentRoll] = (this.gameStats.rolls[this.currentRoll] || 0) + 1;
      this.tourneyStats.rolls[this.currentRoll] = (this.tourneyStats.rolls[this.currentRoll] || 0) + 1;

      this.gameStats.rollHistory.push(this.currentRoll);
      this.tourneyStats.rollHistory.push(this.currentRoll);

      if (this.userSettings.playSounds) {
        if (this.currentRoll == 7) this.soundService.playSoundSeven();
        // else if (this.selectedDice[0] == this.selectedDice[1]) this.soundService.playSoundDouble();
        else this.soundService.playSoundSuccess();
      }
    } else if (this.userSettings.playSounds) this.soundService.playSoundFailure();

    //  clear current selections
    this.selectedDie = 0;

    this.updateDisplay();

    this.adjustOverlayFontSize()

    //  turn ended / next turn begins
    this.stopTurnTimer();
    this.startTurnTimer();
  }

  undoLastRoll() {
    if (this.gameStats.rollHistory.length > 0) {
      if (confirm('are you sure you want to undo the last roll?') == false) {
        return;
      }

      const lastRoll = this.gameStats.rollHistory[this.gameStats.rollHistory.length - 1]; // Get the last roll

      this.gameStats.rollHistory.pop(); // Remove the last roll from the game history
      this.tourneyStats.rollHistory.pop(); // Remove the last roll from the tournament history

      this.gameStats.rolls[lastRoll] = (this.gameStats.rolls[lastRoll] || 0) - 1; // Decrease the count for that roll
      this.tourneyStats.rolls[lastRoll] = (this.tourneyStats.rolls[lastRoll] || 0) - 1; // Decrease the count for that roll

      this.updateDisplay();
    }

    this.setDocumentFocus();
  }

  //#endregion

}
