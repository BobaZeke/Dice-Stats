import { Component, ElementRef, HostListener, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayStats } from './gameStats';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit {
  private defaultEmptyTime = "0:00:00";

  /** number of sides per die */
  public dice = [1, 2, 3, 4, 5, 6];

  /** possible combinations of 2 (6 sided) dice > 2-12 */
  public numberRange = Array.from({ length: 11 }, (_, i) => i + 2);

  /** the selections for the two dice */
  public selectedDice = [0, 0];
  public bars: Array<number> = [];  //  bars to display how many times a given number was rolled

  public gameStats: PlayStats = new PlayStats();     //  game stats
  public tourneyStats: PlayStats = new PlayStats();  //  tournament stats

  public gameHistory: PlayStats[] = []; //  game history object

  // temp variable for swapping game, tourney, and history display
  private saveStats: PlayStats = new PlayStats(); 

  /** tracks the person's turn duration */
  public turnDurationDisplay: string = this.defaultEmptyTime;
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
  public breakDurationDisplay: string = this.defaultEmptyTime;
  private breakIntervalId: any;
  private gameBreakSeconds = 0;
  private gameBreakTotalSeconds = 0;

  /** tracks # of keystrokes so we can toggle dice (used by handleGlobalKeydown)
   * if the user messes up, but hasn't hit enter, they can just re-key the values until they get the ones they want
   */
  private keystrokeCount: number = 0;

  /** used by user message popup */
  private skipNext = false;

  public rollHistoryHit = "&#9632;";      //  solid square (black square)
  public rollHistoryMiss = "&#9633;";   //  empty square (white square)

  /**
   * display size of the roll history (em)
   */
  public rollHistorySize = 3;

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

  /**
   * highlight colors for the rolls, indicating frequency compared to the others
   */
  private readonly colorGradients = [
    "#FFFF00",  // Yellow  (least frequent)
    "#FFA500",  // Orange
    "#FF00FF",  // Magenta
    "#FF0000",  // Red
    "#800080",  // Purple
    "#800000",  // Maroon
    "#808013",  // Green
    "#5e5e02",  // Olive
    "#056324",  // Cyan
    "#064179",  // Teal
    "#0000FF"   // Blue  (most frequent)
  ];
  /**
   *  start by showing all possible colors
   */
  public defaultRollCountColors: { [key: number]: string } = {
    2: this.colorGradients[0],  // Yellow
    3: this.colorGradients[1],  // Orange
    4: this.colorGradients[2],  // Magenta
    5: this.colorGradients[3],  // Red
    6: this.colorGradients[4],  // Purple
    7: this.colorGradients[5],  // Maroon
    8: this.colorGradients[6],  // Olive
    9: this.colorGradients[7],  // Green
    10: this.colorGradients[8],  // Cyan
    11: this.colorGradients[9],  // Teal
    12: this.colorGradients[10]  // Blue
  };

  public colorMappedRolls: { [key: number]: string } = this.defaultRollCountColors;

  // fun with the resume game button
  public blockScreenOpacity: number = 0.9;
  public resumeButtonOpacity: number = 1;

  public showContextMenu = false; // Flag to control the visibility of the context menu
  public contextMenuPosition = { x: 0, y: 0 };

  public currentRoll: number | null = null; //  current roll value (sum of the two dice)

  //  variables for 'game history' display
  public showGameHistory = false;
  public gameHistoryIndex: number = 0;
  
  public isDiceContainerVisible: boolean = false;

  public barParentWidth: number = 1; // Default value to prevent division by zero
  
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnInit() {
    this.endGame();
  }

  ngAfterViewInit(): void {
    this.updateBarParentWidth(); // Measure the parent element after the view is initialized
    this.cdr.detectChanges(); // Trigger change detection manually
  }

  //#region Main Game Events      //    //    //    //    //    //    //

  /**
   * clear everything and start over
   */
  public endGame() {
    this.showContextMenu = false;

    this.closeTournamentDisplay(); //  close tournament display if open

    this.gameIsStopped = true;

    //  save the current game stats to history
    if (this.gameStats.rollHistory.length > 0) {
        this.gameHistory.push(this.gameStats);
        this.gameHistoryIndex = this.gameHistory.length - 1; //  set to the last index (current game)
        this.gameStats = this.gameHistory[this.gameHistoryIndex]; //  set to this game (from history)
        this.showGameHistory = true;
    }

    this.selectedDice = [0, 0];

    this.stopTurnTimer();

    this.pauseGame();

    this.updateDisplay();

    //  after the user clicks a button, the button retains focus.  
    // Then, when they try to enter the next roll, the enter key event is sent to the button, instead of our function
    this.setDocumentFocus();
  }

  public pauseGame(): void {
    this.showContextMenu = false;
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
      this.savedGameDuration += this.calculateDuration(this.gameStartTime, Date.now());
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
      this.gameStats = new PlayStats();
      this.gameStats.breakDurationDisplay = this.defaultEmptyTime;
      this.gameStats.playingDurationDisplay = this.defaultEmptyTime;

      if(this.tourneyStats.rollHistory.length == 0) { //  no history, so init
        this.tourneyStats = new PlayStats();
        this.tourneyStats.breakDurationDisplay = this.defaultEmptyTime;
        this.tourneyStats.playingDurationDisplay = this.defaultEmptyTime;
      }

      this.savedGameDuration = 0;
      this.gameIsStopped = false;
      
      this.updateGameBreakTotal(0);

      this.clearMappedColors();
      this.updateDisplay();
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
    this.showContextMenu = false;
    
    if (this.skipNext) {
      this.skipNext = false;
      return;
    }
    
    if(this.isDiceContainerVisible) this.toggleDiceContainer(); //  close dice container if open

    // if (this.showPopupMessage) { //  close popup for any click
    //   this.showPopupMessage = false;
    // }
  }
  
  @HostListener('window:wheel', ['$event'])
  onScroll(event: WheelEvent): void {
    if (this.showGamePause) {  //  if game is paused, change opacity of the overlay
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

  @HostListener('document:contextmenu', ['$event'])
  onRightClick(event: MouseEvent): void {
    event.preventDefault(); // Prevent the default context menu from appearing
    event.preventDefault(); // Prevent the default browser context menu
    this.showContextMenu = true; // Show your custom context menu
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
  }

  // monitor keystrokes (die count input, display toggles, etc.)
  @HostListener('document:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    // console.log(`key down : '${event.key}'`);

    this.showContextMenu = false;

    if (event.key == 'Shift') {
      this.showDieCounts = !this.showDieCounts;
      return;
    }
    if (event.key == 'Control') {
      this.toggleTournamentDisplay();
      return;
    }

    if (!this.showingTournament && (event.key == 'ArrowRight' || event.key == 'ArrowLeft')) {
      if (this.showGameHistory) {
        this.gameHistoryIndex += event.key == 'ArrowRight' ? +1 : -1;
        if (this.gameHistoryIndex >= this.gameHistory.length) this.gameHistoryIndex = 0;
        if (this.gameHistoryIndex < 0) this.gameHistoryIndex = this.gameHistory.length - 1;
  
        this.gameStats = this.gameHistory[this.gameHistoryIndex];
  
        this.updateDisplay();
      } else {  //  change the roll history size
        this.rollHistorySize += event.key == 'ArrowRight' ? +0.5 : -0.5;
        if (this.rollHistorySize <= 0) this.rollHistorySize = 0.5;
        if (this.rollHistorySize >= 10) this.rollHistorySize = 10;
      }

      return;
    }

    if (this.showGamePause) {
      return;
    }

    if (event.key == 'Enter') {
      this.closeTournamentDisplay(); //  close tournament display if open
      this.storeValues();
      this.keystrokeCount = 0;
      return;
    }

    //  if we get here, then let's try to process as a roll
    const num = parseInt(event.key);
    if (num >= 0 && num < 7) {  //  include zero as a way of clearing selections
      this.closeTournamentDisplay(); //  close tournament display if open
      this.keystrokeCount++;
      this.selectDie(this.keystrokeCount, num);
      if (this.keystrokeCount >= 2) this.keystrokeCount = 0;
    }

    this.currentRoll = null; //  reset current roll value
    //  if we have two dice selected, calculate the current roll value
    //  (this is done in the storeValues() function, but we need it here to update the display)
    if ((this.selectedDice[0] > 0 && this.selectedDice[1] > 0)) {
      this.currentRoll = this.selectedDice[0] + this.selectedDice[1];
    }
  }

  //#endregion
  //#region Display Updates       //    //    //    //    //    //    //

  private updateGameBreak(setValue: number) {
    if (setValue == 0) this.gameBreakSeconds = 0;
    else this.gameBreakSeconds += setValue;

    if (this.gameBreakSeconds > 0) {
      this.breakDurationDisplay = this.formatDuration(this.gameBreakSeconds);
    }
    else this.breakDurationDisplay = this.defaultEmptyTime;
  }

  private updateGameBreakTotal(setValue: number) {
    if (setValue == 0) this.gameBreakTotalSeconds = 0;
    else this.gameBreakTotalSeconds += setValue;

    if (this.gameBreakTotalSeconds > 0) {
      this.gameStats.breakDurationDisplay = this.formatDuration(this.gameBreakTotalSeconds);
    }
    else this.gameStats.breakDurationDisplay = this.defaultEmptyTime;
  }

  private updateTournamentBreakDuration(setValue: number) {
    if (setValue == 0) this.tournamentBreakSeconds = 0;
    else this.tournamentBreakSeconds += setValue;

    if (this.tournamentBreakSeconds > 0) {
      this.tourneyStats.breakDurationDisplay = this.formatDuration(this.tournamentBreakSeconds);
    }
    else this.tourneyStats.breakDurationDisplay = this.defaultEmptyTime;
  }

  private incrementTournamentDuration() {
    this.tournamentSeconds = this.tournamentSeconds + 1;

    this.tourneyStats.playingDurationDisplay = this.formatDuration(this.tournamentSeconds);
  }

  private updateGameDuration() {
    if (this.gameStartTime !== null) {
      this.gameStats.playingDurationDisplay = this.calcAndFormatDuration(this.gameStartTime, Date.now(), this.savedGameDuration);
    }
    else this.gameStats.playingDurationDisplay = this.defaultEmptyTime;
  }

  private updateTurnDuration() {
    if (this.turnStartTime !== null) {
      this.turnDurationDisplay = this.calcAndFormatDuration(this.turnStartTime, Date.now());
    }
    else this.turnDurationDisplay = this.defaultEmptyTime;
  }

  private updateDisplay() {
    this.updateBars();
    this.mapRollsToColors();
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

  public rollHistorySizeSmaller() {
    this.showContextMenu = false;
    this.rollHistorySize = this.rollHistorySize - .5;
    if (this.rollHistorySize <= 0) this.rollHistorySize = .5;
  }

  public rollHistorySizeLarger() {
    this.showContextMenu = false;
    this.rollHistorySize = this.rollHistorySize + .5;
  }

  /** prevent barbarian and knight buttons from triggering (so we can handle it) */
  ignoreEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent the default behavior of the Enter key
    }
  }

  //#endregion
  //#region Display Toggles       //    //    //    //    //    //    //
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

  closeTournamentDisplay() {
    if(this.showingTournament) this.toggleTournamentDisplay(); //  close tournament display if open
  }
  toggleTournamentDisplay() {
    this.showingTournament = !this.showingTournament;

    if(this.gameIsStopped) { //  game is stopped, so we need to toggle between history and tournament
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

  rollCount() {
    return this.gameStats.rollHistory.length;
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
    let sevenIndices: number[] = []; // Array to store indices where 7 occurs

    // Find indices where 7 is rolled
    this.gameStats.rollHistory.forEach((key, index) => {
      if (key === dieNumber) {
        sevenIndices.push(index);
      }
    });

    // If no occurrences of 7, return total length of rollHistory
    if (sevenIndices.length === 0) {
      return this.gameStats.rollHistory.length; // Entire roll history since no 7s were rolled
    }

    return (this.gameStats.rollHistory.length / sevenIndices.length).toFixed(1);
  }

  /**
   * % this # has been rolled
   * @param num 
   * @returns 
   */
  getBarPercent(num: number): number {
    if (this.bars[num] <= 0) return 0;

    const perc = (this.bars[num] / this.rollCount()) * 100;
    //const perc = (this.bars[num] / this.maxRollCount()) * 100;

    return Math.trunc(perc);
  }

  private clearMappedColors() {
    this.colorMappedRolls = { 
      2: "#FFFFFF", 3: "#FFFFFF", 4: "#FFFFFF", 5: "#FFFFFF", 6: "#FFFFFF",
      7: "#FFFFFF", 8: "#FFFFFF", 9: "#FFFFFF", 10: "#FFFFFF", 11: "#FFFFFF", 12: "#FFFFFF"
    };
  }

  /**
   * Function to map roll counts to a gradient of colors which depict how often each number rolls
   * populates the color mapped rolls object : key is the dice roll, and value is the associated color
   * dice which have been rolled the same number of times get the same color
   * color is based on where the die's count lies within the 11 spread spectrum
   */
  private mapRollsToColors(): void {   
    this.clearMappedColors(); // Reset the colors before mapping

    // Get the rolls and their frequencies
    const rollKeys = Object.keys(this.gameStats.rolls).map(Number);

    if(rollKeys.length <= 0) {  //  no rolls to process
      // if(this.gameIsStopped) return;   //  keep default init colors

      // //  reset roll highlighting to white / none
      // this.clearMappedColors();
      
      return;
    }


    // Find the maximum and minimum frequencies
    const frequencies = Object.values(this.gameStats.rolls);
    const maxFrequency = Math.max(...frequencies);
    const minFrequency = Math.min(...frequencies);


    // Calculate colors based on frequency
    rollKeys.forEach((roll) => {
      const frequency = this.gameStats.rolls[roll];
      if (frequency === maxFrequency) {           // Red for most frequent
        this.colorMappedRolls[roll] = this.colorGradients[this.colorGradients.length - 1];
      } else if (frequency === minFrequency) {    // Green for least frequent
        this.colorMappedRolls[roll] = this.colorGradients[0];
      } else {                                    // Calculate relative color index for intermediate values
        const relativeFrequency = (frequency - minFrequency) / (maxFrequency - minFrequency);
        const colorIndex = Math.round(relativeFrequency * (this.colorGradients.length - 1));
        this.colorMappedRolls[roll] = this.colorGradients[colorIndex];
      }
    });
  }

  /**
   * calculates the number of seconds between the two times
   * @param startTime 
   * @param currentTime 
   * @returns # seconds
   */
  private calculateDuration(startTime: number, currentTime: number): number {
    return Math.floor((currentTime - startTime) / 1000); // Convert milliseconds to seconds
  }

  /**
   * calculates the duration and formats the value for display
   * @param startTime 
   * @param currentTime 
   * @param savedDuration 
   * @returns h:mm:ss (hours:minutes:seconds)
   */
  private calcAndFormatDuration(startTime: number, currentTime: number, savedDuration: number = 0): string {
    const totalSeconds = this.calculateDuration(startTime, currentTime) + savedDuration;
    return this.formatDuration(totalSeconds);
  }
  /**
   * translates the given seconds into a duration display 0:00:00
   * @param totalSeconds 
   * @returns h:mm:ss (hours:minutes:seconds)
   */
  private formatDuration(totalSeconds: number) {
    const seconds = totalSeconds % 60; // Extract remaining seconds
    const totalMinutes = Math.floor(totalSeconds / 60); // Convert seconds to minutes
    const minutes = totalMinutes % 60; // Extract remaining minutes
    const hours = Math.floor(totalMinutes / 60); // Convert minutes to hours

    // Format the time as hours:minutes:seconds
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
  selectDie(column: number, value: number) {
    this.selectedDice[column - 1] = value;
  }

  /**
   * Do we have a Yellow Die selection?
   * (die color bears no significance)
   * @returns 
   */
  haveSelectedYellowDie() {
    return this.selectedDice[0] > 0;
  }

  /**
   * Do we have a Red Die selection?
   * (die color bears no significance)
   * @returns 
   */
  haveSelectedRedDie() {
    return this.selectedDice[1] > 0;
  }

  /**
   * store/save the selected dice values (and update history etc.)
   */
  storeValues() {
    //  if valid entry, process the selections...
    if ((this.selectedDice[0] > 0 && this.selectedDice[1] > 0)) {
      this.currentRoll = this.selectedDice[0] + this.selectedDice[1];

      this.gameStats.rolls[this.currentRoll] = (this.gameStats.rolls[this.currentRoll] || 0) + 1;
      this.tourneyStats.rolls[this.currentRoll] = (this.tourneyStats.rolls[this.currentRoll] || 0) + 1;

      this.gameStats.rollHistory.push(this.currentRoll);
      this.tourneyStats.rollHistory.push(this.currentRoll);
    }

    //  clear current selections
    this.selectedDice = [0, 0];

    this.updateDisplay();

    //  turn ended / next turn begins
    this.stopTurnTimer();
    this.startTurnTimer();
  }

  undoLastRoll() {
    this.showContextMenu = false;

    if (this.gameStats.rollHistory.length > 0) {
      const lastRoll = this.gameStats.rollHistory[this.gameStats.rollHistory.length - 1]; // Get the last roll

      this.gameStats.rollHistory.pop(); // Remove the last roll from the game history
      this.tourneyStats.rollHistory.pop(); // Remove the last roll from the tournament history

      this.gameStats.rolls[lastRoll] = (this.gameStats.rolls[lastRoll] || 0) - 1; // Decrease the count for that roll
      this.tourneyStats.rolls[lastRoll] = (this.tourneyStats.rolls[lastRoll] || 0) - 1; // Decrease the count for that roll

      this.updateDisplay();
    }
  }

  //#endregion

}
