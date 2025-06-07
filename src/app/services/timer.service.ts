import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TimeFormatService } from './time-format.service';

export interface TimerHandle {
  intervalId: any;
  startTime: number | null;
  elapsed: number;
  display$: BehaviorSubject<string>;
}

@Injectable({
  providedIn: 'root'
})
export class GameTimerService {
  constructor(private formatService: TimeFormatService) {}

  /**
   * Creates a new timer (handle) with default values.
   * This timer handle can be used to start, stop, and reset a timer.
   * It initializes the timer with:
   * - intervalId: null (no timer running)
   * - startTime: null (not started)
   * - elapsed: 0 (no time elapsed)
   * - display$: a BehaviorSubject initialized to the default empty time format (0:00:00).
   * The display$ observable can be subscribed to for real-time updates for components that need to show the elapsed time.
   * @returns 
   */
  createTimer(): TimerHandle {
    return {
      intervalId: null,
      startTime: null,
      elapsed: 0,
      display$: new BehaviorSubject<string>(this.formatService.defaultEmptyTime)
    };
  }

  /**
   * Starts the timer and begins counting elapsed time.
   * Note: If the timer is already running, this will do nothing.
   * If an update function is provided, it will be called every second while the timer is running.
   * The timer can be re-started from a stopped state without losing elapsed time.
   * @param timer 
   * @param updateFn 
   */
  start(timer: TimerHandle, updateFn?: () => void) {
    if (!timer.intervalId) {
      timer.startTime = Date.now();
      timer.intervalId = setInterval(() => {
        this.updateDisplay(timer);
        if (updateFn) updateFn();
      }, 1000);
    }
  }

  /**
   * Stops the timer, but does not reset the elapsed time.
   * This allows the timer to be resumed (start) later without losing the elapsed time.
   * @param timer 
   */
  stop(timer: TimerHandle) {
    if (timer.intervalId) {
      clearInterval(timer.intervalId);
      timer.elapsed += Date.now() - (timer.startTime ?? Date.now());
      timer.intervalId = null;
      timer.startTime = null;
      this.updateDisplay(timer);
    }
  }

  /**
   * Stops the timer and Resets the duration to zero
   * This allows the timer to be restarted from zero.
   * @param timer 
   */
  reset(timer: TimerHandle) {
    this.stop(timer);
    timer.elapsed = 0;
    timer.display$.next(this.formatService.defaultEmptyTime);
  }

  /**
   * Broadcast an update to the display subscribers.
   * This is called by the timer service to update the display with the current elapsed time.
   * This will not reset the timer or change its state.
   * It will only update the display.
   * It can also be called manually if needed.
   * This is useful for cases where the timer is paused or stopped, but the display needs to be refreshed.
   * @param timer 
   */
  updateDisplay(timer: TimerHandle) {
    let msDuration = timer.elapsed;
    if (timer.startTime) {
      msDuration += Date.now() - timer.startTime;
    }
    const secsDuration = Math.floor(msDuration / 1000);
    const formatedDuration = this.formatService.formatDuration(secsDuration);
    timer.display$.next(formatedDuration);
  }

  /**
   * Subscribe to this to get notifications of updates to the duration.
   * This allows components to subscribe to timer updates and display the current elapsed time.
   * It will emit the current display value immediately upon subscription.
   * This is useful for components that need to show the timer display in real-time.
   * It can also be used to initialize the display when the timer is created or reset.
   * It is important to note that this observable will not emit updates if the timer is stopped or reset.
   * It will only emit updates while the timer is running and the display is being updated.
   * This is by design to avoid unnecessary updates when the timer is not active.
   * @param timer 
   * @returns 
   */
  getDisplay(timer: TimerHandle) {
    return timer.display$.asObservable();
  }
}