import { Injectable } from '@angular/core';
import { PlayStats } from './gameStats';

/**
 * Service to manage trends in dice rolls.
 * It provides methods to determine if a number is on the rise or falling off,
 * and generate tooltips for trend indicators.
 * The trend is determined by comparing the recent average of rolls to the historical average.
 * The recent average is calculated from the last 25% of rolls.
 * The historical average is calculated from the total rolls.
 */
@Injectable({
    providedIn: 'root',
})   
export class TrendService {
      /**
   * Determines if a number is on the rise or falling off.
   * @param number The number to check.
   * @returns True if the number is on the rise, false otherwise.
   */
  isNumberRising(tourneyStats: PlayStats, number: number): boolean {
    const rollCount = tourneyStats.rollHistory.length;  // use the  stats from all night (not just this game)
    if (rollCount <= 0) return false; // No rolls to process

    //  determine how many recent rolls to review...
    let inspectCount = rollCount * 0.25;  //    0.1;
    if (inspectCount < 1) { //  if less than 1, use half the rolls
      inspectCount = Math.ceil(rollCount / 2);  //  round up
      if (inspectCount < 1) inspectCount = 1;
    }
    inspectCount = Math.ceil(inspectCount); //  round up to the next whole number

    //  analyze the data and compare the recent rolls to the historical average
    const recentRolls = this.getRecentRolls(tourneyStats, number, inspectCount);

    var hitCount = recentRolls.reduce((sum, roll) => sum + roll, 0);
    const recentAverage = hitCount / recentRolls.length;

    const historicalAverage = tourneyStats.rolls[number] / rollCount;

    return recentAverage >= historicalAverage; // Rising if recent average is greater or equal to historical average
  }

  /**
   * Gets the recent roll history for a specific number.
   * @param number The number to check.
   * @param count The number of recent rolls to consider.
   * @returns An array of recent rolls for the specified number.
   */
  getRecentRolls(tourneyStats: PlayStats, number: number, count: number): number[] {
    const rollHistory = tourneyStats.rollHistory.slice(-count); // Get the last 'count' rolls
    return rollHistory.map(roll => (roll === number ? 1 : 0)); // Map to 1 if the number was rolled, 0 otherwise
  }

  /**
   * Generates a tooltip for the trend indicator.
   * @param number The number to check.
   * @returns A string describing the trend.
   */
  getTrendTooltip(tourneyStats: PlayStats, number: number): string {
    // if (!this.showTooltips) return ""; //  don't show tooltips if disabled
    return this.isNumberRising(tourneyStats, number)
                  ? `${number} is on the rise!`
                  : `${number} is falling off.`;
  }

}