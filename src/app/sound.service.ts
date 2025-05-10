import { Injectable } from '@angular/core';

/**
 * Service to manage sound effects for the application.
 * It provides methods to play success and failure sounds.
 * The sounds are loaded from the assets/sounds directory.
 * The sounds are played using the HTMLAudioElement API.
 */
@Injectable({
    providedIn: 'root',
})
export class SoundService {
    private soundSuccess: HTMLAudioElement = new Audio();
    private soundFailure: HTMLAudioElement = new Audio();

    constructor() {
        this.soundSuccess = new Audio('assets/sounds/coin-recieved-230517.mp3');
        this.soundFailure = new Audio('assets/sounds/rubber-tire-screech-7-202580.mp3');
    }

    public playSoundSuccess(): void {
        this.playSound(this.soundSuccess);
    }
    public playSoundFailure(): void {
        this.playSound(this.soundFailure)
    }

    playSound(sound: HTMLAudioElement): void {
        //if (sound) {
          sound.currentTime = 0; // Reset to the beginning
          sound.play();
        //} console.error(`Sound not found: `, sound);
      }
}