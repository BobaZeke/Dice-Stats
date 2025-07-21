import { TestBed } from '@angular/core/testing';
import { SoundService } from './sound.service';

// src/app/services/sound.service.test.ts

class MockAudio {
    src = '';
    currentTime = 0;
    play = jasmine.createSpy('play');
    constructor(src?: string) {
        if (src) this.src = src;
    }
}

describe('SoundService', () => {
    let service: SoundService;
    let originalAudio: any;

    beforeAll(() => {
        originalAudio = (window as any).Audio;
        (window as any).Audio = MockAudio;
    });

    afterAll(() => {
        (window as any).Audio = originalAudio;
    });

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SoundService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize audio elements with correct sources', () => {
        expect((service as any).success.src).toContain('assets/sounds/success.mp3');
        expect((service as any).error.src).toContain('assets/sounds/error.mp3');
        expect((service as any).number_select.src).toContain('assets/sounds/number_select.mp3');
        expect((service as any).seven.src).toContain('assets/sounds/seven.mp3');
        expect((service as any).bump.src).toContain('assets/sounds/bump.mp3');
        expect((service as any).escape.src).toContain('assets/sounds/escape.mp3');
    });

    it('playSoundSuccess should call playSound with success audio', () => {
        spyOn(service as any, 'playSound');
        service.playSoundSuccess();
        expect((service as any).playSound).toHaveBeenCalledWith((service as any).success);
    });

    it('playSoundFailure should call playSound with error audio', () => {
        spyOn(service as any, 'playSound');
        service.playSoundFailure();
        expect((service as any).playSound).toHaveBeenCalledWith((service as any).error);
    });

    it('playSoundNumberSelect should call playSound with number_select audio', () => {
        spyOn(service as any, 'playSound');
        service.playSoundNumberSelect();
        expect((service as any).playSound).toHaveBeenCalledWith((service as any).number_select);
    });

    it('playSoundSeven should call playSound with seven audio', () => {
        spyOn(service as any, 'playSound');
        service.playSoundSeven();
        expect((service as any).playSound).toHaveBeenCalledWith((service as any).seven);
    });

    it('playSoundBump should call playSound with bump audio', () => {
        spyOn(service as any, 'playSound');
        service.playSoundBump();
        expect((service as any).playSound).toHaveBeenCalledWith((service as any).bump);
    });

    it('playSoundEscape should call playSound with escape audio', () => {
        spyOn(service as any, 'playSound');
        service.playSoundEscape();
        expect((service as any).playSound).toHaveBeenCalledWith((service as any).escape);
    });

    it('playSound should reset currentTime and call play()', () => {
        const mockAudio = new MockAudio();
        mockAudio.currentTime = 5;
        service.playSound(mockAudio as any);
        expect(mockAudio.currentTime).toBe(0);
        expect(mockAudio.play).toHaveBeenCalled();
    });
});