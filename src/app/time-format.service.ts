import { Injectable } from '@angular/core';

/**
 * Service to manage time formatting and duration calculations.
 * It provides methods to calculate the duration between two times,
 * format the duration into a string, and handle default empty time values.
 * The default empty time is set to "0:00:00".
 * The duration is calculated in seconds and formatted as hours:minutes:seconds.
 * The default empty time is used when no valid time is provided.
 */
@Injectable({
  providedIn: 'root',
})
export class TimeFormatService {

  public defaultEmptyTime = "0:00:00";
  
  /**
   * calculates the number of seconds between the two times
   * @param startTime 
   * @param currentTime 
   * @returns # seconds
   */
  public calculateDuration(startTime: number, currentTime: number): number {
    return Math.floor((currentTime - startTime) / 1000); // Convert milliseconds to seconds
  }

  /**
   * calculates the duration and formats the value for display
   * @param startTime 
   * @param currentTime 
   * @param savedDuration 
   * @returns h:mm:ss (hours:minutes:seconds)
   */
  public calcAndFormatDuration(startTime: number, currentTime: number, savedDuration: number = 0): string {
    const totalSeconds = this.calculateDuration(startTime, currentTime) + savedDuration;
    return this.formatDuration(totalSeconds);
  }
  /**
   * translates the given seconds into a duration display 0:00:00
   * @param totalSeconds 
   * @returns h:mm:ss (hours:minutes:seconds)
   */
  public formatDuration(totalSeconds: number) {
    const seconds = totalSeconds % 60; // Extract remaining seconds
    const totalMinutes = Math.floor(totalSeconds / 60); // Convert seconds to minutes
    const minutes = totalMinutes % 60; // Extract remaining minutes
    const hours = Math.floor(totalMinutes / 60); // Convert minutes to hours

    // Format the time as hours:minutes:seconds
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}