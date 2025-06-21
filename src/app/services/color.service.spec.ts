import { ColorService } from './color.service';
import { ColorOption } from '../models/color-option.enum';
import { Stats } from '../models/stats';

describe('ColorService', () => {
    let service: ColorService;

    beforeEach(() => {
        service = new ColorService();
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    describe('hexToRgb', () => {
        it('should convert hex to rgb', () => {
            expect(service.hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
            expect(service.hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
            expect(service.hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
        });

        it('should return white for invalid input', () => {
            expect(service.hexToRgb('')).toEqual({ r: 255, g: 255, b: 255 });
        });
    });

    describe('hexToRgba', () => {
        it('should convert hex to rgba string', () => {
            expect(service.hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
        });
    });

    describe('rgbaToHex', () => {
        it('should convert rgba to hex', () => {
            expect(service.rgbaToHex('rgba(255, 0, 0, 1)')).toBe('#ff0000');
            expect(service.rgbaToHex('#123456')).toBe('#123456');
        });

        it('should return #000000 for invalid input', () => {
            expect(service.rgbaToHex('invalid')).toBe('#000000');
        });
    });

    describe('rgbToHex', () => {
        it('should convert rgb to hex', () => {
            expect(service.rgbToHex(255, 0, 0)).toBe('#ff0000');
            expect(service.rgbToHex(0, 255, 0)).toBe('#00ff00');
            expect(service.rgbToHex(0, 0, 255)).toBe('#0000ff');
        });
    });

    describe('rgbToRgba', () => {
        it('should convert rgb to rgba string', () => {
            expect(service.rgbToRgba(255, 0, 0, 0.5)).toBe('rgba(255, 0, 0, 0.50)');
        });
    });

    describe('isHexColor', () => {
        it('should validate hex colors', () => {
            expect(service['isHexColor']('#fff')).toBeTrue();
            expect(service['isHexColor']('#ffffff')).toBeTrue();
            expect(service['isHexColor']('#123abc')).toBeTrue();
            expect(service['isHexColor']('123abc')).toBeFalse();
            expect(service['isHexColor']('#ggg')).toBeFalse();
        });
    });

    describe('getOpacity', () => {
        it('should extract opacity from rgba', () => {
            expect(service.getOpacity('rgba(255,0,0,0.5)')).toBeCloseTo(0.5);
            expect(service.getOpacity('rgba(255,0,0,1)')).toBeCloseTo(1);
            expect(service.getOpacity('rgb(255,0,0)')).toBe(1);
        });
    });

    describe('isColorLight', () => {
        it('should detect light colors', () => {
            expect(service.isColorLight('#ffffff')).toBeTrue();
            expect(service.isColorLight('rgb(255,255,255)')).toBeTrue();
            expect(service.isColorLight('#000000')).toBeFalse();
            expect(service.isColorLight('rgb(0,0,0)')).toBeFalse();
            expect(service.isColorLight('rgba(255,255,255,0.5)')).toBeTrue();
        });

        it('should handle invalid input', () => {
            expect(service.isColorLight('invalid')).toBeTrue();
        });
    });

    describe('clearMappedColors', () => {
        it('should reset colorMappedRolls to all white', () => {
            service.colorMappedRolls = { 2: '#000000' };
            service.clearMappedColors();
            for (let i = 2; i <= 12; i++) {
                expect(service.colorMappedRolls[i]).toBe('#FFFFFF');
            }
        });
    });

    describe('showSampleColors', () => {
        it('should map rolls to density colors when ColorOption.Density', () => {
            service.colorDensityColor = '#184e07';
            service.showSampleColors(ColorOption.Density);
            expect(Object.keys(service.colorMappedRolls).length).toBe(service.density.length);
            expect(service.colorMappedRolls[2]).toContain('rgba(');
        });

        it('should map rolls to color gradients when ColorOption.Color', () => {
            service.showSampleColors(ColorOption.Color);
            expect(service.colorMappedRolls[2]).toBe(service.colorGradients[0]);
            expect(service.colorMappedRolls[12]).toBe(service.colorGradients[10]);
        });
    });

    describe('generateGradient', () => {
        it('should generate a gradient and update colorGradients', () => {
            service.generateGradient('#0000ff', '#ff0000', 2);
            expect(service.colorGradients.length).toBeGreaterThan(0);
            expect(service.colorGradients[0]).toContain('rgba(');
        });

        it('should handle missing colors gracefully', () => {
            spyOn(console, 'error');
            service.generateGradient('', '#ff0000');
            expect(console.error).toHaveBeenCalled();
            service.generateGradient('#0000ff', '');
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('mapRollFrequencyColor', () => {
        const stats: Stats = {
            rolls: { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9, 11: 10, 12: 11 },
            rollHistory: [],
            playingDurationDisplay: '',
            breakDurationDisplay: ''
        };

        it('should clear mapped colors if rollCount is 0', () => {
            service.mapRollFrequencyColor(0, ColorOption.Color, stats, 11);
            for (let i = 2; i <= 12; i++) {
                expect(service.colorMappedRolls[i]).toBe('#FFFFFF');
            }
        });

        it('should map rolls to density colors', () => {
            service.colorDensityColor = '#184e07';
            service.mapRollFrequencyColor(10, ColorOption.Density, stats, 11);
            expect(Object.keys(service.colorMappedRolls).length).toBe(11);
        });

        it('should map rolls to color gradients', () => {
            service.mapRollFrequencyColor(10, ColorOption.Color, stats, 11);
            expect(Object.keys(service.colorMappedRolls).length).toBe(11);
        });
    });

    describe('private mapRollsToColors', () => {
        it('should assign correct colors based on frequency', () => {
            const stats: Stats = {
                rolls: { 2: 1, 3: 1, 4: 5, 5: 10 },
                rollHistory: [],
                playingDurationDisplay: '',
                breakDurationDisplay: ''
            };
            // @ts-ignore: access private method for test
            service['mapRollsToColors'](stats);
            expect(service.colorMappedRolls[5]).toBe(service.colorGradients[service.colorGradients.length - 1]);
            expect(service.colorMappedRolls[2]).toBe(service.colorGradients[0]);
        });
    });

    describe('private mapRollsToDensity', () => {
        it('should assign density-based colors', () => {
            const stats: Stats = {
                rolls: { 2: 1, 3: 5, 4: 10 },
                rollHistory: [],
                playingDurationDisplay: '',
                breakDurationDisplay: ''
            };
            service.colorDensityColor = '#184e07';
            // @ts-ignore: access private method for test
            service['mapRollsToDensity'](stats, 10);
            expect(service.colorMappedRolls[2]).toContain('rgba(');
        });

        it('should handle invalid colorDensityColor', () => {
            service.colorDensityColor = 'invalid';
            spyOn(console, 'error');
            // @ts-ignore: access private method for test
            service['mapRollsToDensity']({ rolls: { 2: 1 } }, 1);
            expect(console.error).toHaveBeenCalled();
        });
    });
});