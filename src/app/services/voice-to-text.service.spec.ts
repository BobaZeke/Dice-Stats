import { TestBed } from '@angular/core/testing';
import { VoiceToTextService } from './voice-to-text.service';
import { Observable } from 'rxjs';

describe('VoiceToTextService', () => {
  let service: VoiceToTextService;
  let origSpeechRecognition: any;

  class MockRecognition {
    public continuous = false;
    public interimResults = false;
    public lang = '';
    public start = jasmine.createSpy('start');
    public stop = jasmine.createSpy('stop');
    public onresult: ((event: any) => void) | null = null;
    public onerror: ((event: any) => void) | null = null;
    public onend: (() => void) | null = null;
  }

  beforeEach(() => {
    origSpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    (window as any).webkitSpeechRecognition = MockRecognition;
    (window as any).SpeechRecognition = undefined;
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoiceToTextService);
  });

  afterEach(() => {
    (window as any).webkitSpeechRecognition = origSpeechRecognition;
    (window as any).SpeechRecognition = origSpeechRecognition;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('startListening', () => {
    it('should call recognition.start if recognition exists', () => {
      service['recognition'] = new MockRecognition();
      service.startListening();
      expect(service['recognition'].start).toHaveBeenCalled();
    });

    it('should emit error if recognition does not exist', (done) => {
      service['recognition'] = null;
      service.startListening().subscribe({
        next: () => {},
        error: (err) => {
          expect(err).toBe('Speech recognition not supported');
          done();
        }
      });
      // flush the setTimeout
      setTimeout(() => {}, 0);
    });

    it('should return an Observable', () => {
      service['recognition'] = new MockRecognition();
      const obs = service.startListening();
      expect(obs instanceof Observable).toBeTrue();
    });
  });

  describe('stopListening', () => {
    it('should call recognition.stop if recognition exists', () => {
      service['recognition'] = new MockRecognition();
      service.stopListening();
      expect(service['recognition'].stop).toHaveBeenCalled();
    });

    it('should do nothing if recognition does not exist', () => {
      service['recognition'] = null;
      expect(() => service.stopListening()).not.toThrow();
    });
  });

  describe('findFirstNumberOrSpelled', () => {
    it('should find a digit in the text', () => {
      expect(service.findFirstNumberOrSpelled('roll 7 please')).toBe(7);
      expect(service.findFirstNumberOrSpelled('I want 12 dice')).toBe(12);
    });

    it('should find a spelled-out number in the text', () => {
      expect(service.findFirstNumberOrSpelled('roll five dice')).toBe(5);
      expect(service.findFirstNumberOrSpelled('give me eleven')).toBe(11);
    });

    it('should return 0 if no number is found', () => {
      expect(service.findFirstNumberOrSpelled('no numbers here')).toBe(0);
    });

    it('should be case-insensitive for spelled numbers', () => {
      expect(service.findFirstNumberOrSpelled('Roll TEN dice')).toBe(10);
      expect(service.findFirstNumberOrSpelled('Give me Nine')).toBe(9);
    });

    it('should return the first number or spelled number only', () => {
      expect(service.findFirstNumberOrSpelled('three and 7')).toBe(3);
      expect(service.findFirstNumberOrSpelled('7 and three')).toBe(7);
    });
  });

  describe('wordToNumber', () => {
    it('should convert spelled-out numbers to numeric values', () => {
      expect(service.wordToNumber('two')).toBe(2);
      expect(service.wordToNumber('seven')).toBe(7);
      expect(service.wordToNumber('twelve')).toBe(12);
    });

    it('should be case-insensitive and trim whitespace', () => {
      expect(service.wordToNumber('  Four  ')).toBe(4);
      expect(service.wordToNumber('NINE')).toBe(9);
    });

    it('should return 0 for unrecognized words', () => {
      expect(service.wordToNumber('zero')).toBe(0);
      expect(service.wordToNumber('thirteen')).toBe(0);
      expect(service.wordToNumber('')).toBe(0);
    });
  });

  // describe('recognition event handlers', () => {
  //   it('should emit transcript on onresult', (done) => {
  //     service['recognition'] = new MockRecognition();
  //     const obs = service.startListening();
  //     obs.subscribe(val => {
  //       expect(val).toBe('hello world');
  //       done();
  //     });
  //     service['recognition'].onresult &&
  //       service['recognition'].onresult({ results: [[{ transcript: 'hello world' }]] });
  //   });

  //   it('should emit error on onerror', (done) => {
  //     service['recognition'] = new MockRecognition();
  //     const obs = service.startListening();
  //     obs.subscribe({
  //       next: () => {},
  //       error: (err) => {
  //         expect(err).toBe('network');
  //         done();
  //       }
  //     });
  //     service['recognition'].onerror &&
  //       service['recognition'].onerror({ error: 'network' });
  //   });
  // });
});