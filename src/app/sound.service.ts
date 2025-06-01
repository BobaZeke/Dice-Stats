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
    private success: HTMLAudioElement = new Audio();
    private number_select: HTMLAudioElement = new Audio();
    private error: HTMLAudioElement = new Audio();
    private seven: HTMLAudioElement = new Audio();
    private bump: HTMLAudioElement = new Audio();
    private escape: HTMLAudioElement = new Audio();

    constructor() {
        this.success = new Audio('assets/sounds/success.mp3');
        this.error = new Audio('assets/sounds/error.mp3');
        this.number_select = new Audio('assets/sounds/number_select.mp3');
        this.seven = new Audio('assets/sounds/seven.mp3');
        this.bump = new Audio('assets/sounds/bump.mp3');
        this.escape = new Audio('assets/sounds/escape.mp3');
    }

    public playSoundSuccess(): void {
        this.playSound(this.success);
    }
    public playSoundFailure(): void {
        this.playSound(this.error)
    }
    public playSoundNumberSelect(): void {
        this.playSound(this.number_select)
    }    
    public playSoundSeven(): void {
        this.playSound(this.seven)
    }
    public playSoundBump(): void {
        this.playSound(this.bump)
    }
    public playSoundEscape(): void {
        this.playSound(this.escape)
    }

    playSound(sound: HTMLAudioElement): void {
        //if (sound) {
          sound.currentTime = 0; // Reset to the beginning
          sound.play();
        //} console.error(`Sound not found: `, sound);
      }
}