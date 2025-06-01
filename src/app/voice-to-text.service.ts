import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VoiceToTextService {
  private recognition: any;
  private transcriptSubject = new Subject<string>();

  constructor() {
    // Check for browser support
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.transcriptSubject.next(transcript);
      };

      this.recognition.onerror = (event: any) => {
        this.transcriptSubject.error(event.error);
      };

      this.recognition.onend = () => {
        // Optionally handle end of recognition
      };
    }
  }

  startListening(): Observable<string> {
    if (this.recognition) {
      this.recognition.start();
    } else {
      setTimeout(() => this.transcriptSubject.error('Speech recognition not supported'), 0);
    }
    return this.transcriptSubject.asObservable();
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  
  /**
   * extracts the first number or spelled-out number from the sentence.
   * @param text 
   * @returns first number found, or 0 if none found
   */
  findFirstNumberOrSpelled(text: string): number {
    const map: { [key: string]: number } = {
      "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
      "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12
    };

    // Regex to match either a number or a spelled-out number
    const regex = /\b(\d+|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i;
    const match = text.match(regex);

    if (match) {
      const value = match[1].toLowerCase();
      if (map[value]) {
        return map[value];
      } else if (!isNaN(Number(value))) {
        return Number(value);
      }
    }
    return 0;
  }

  /**
   * converts a spelled-out number (two, three, etc.) to its numeric value (2, 3, etc.).
   * @param word 
   * @returns numeric value of the spelled-out number, or 0 if not recognized
   */
  wordToNumber(word: string): number {
    const map: { [key: string]: number } = {
      "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
      "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12
    };
    const normalized = word.trim().toLowerCase();
    return map[normalized] ?? 0;
  }
}