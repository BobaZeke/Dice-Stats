import { Injectable } from '@angular/core';
import { Stats } from '../models/stats';
import { ColorOption } from '../models/color-option.enum'; // Import the enum

/**
 * Service to manage color mapping for dice rolls based on frequency.
 * It provides methods to clear colors, map rolls to colors,
 * and map rolls to density-based colors.
 * The color mapping is based on a gradient of colors, where the least
 * frequent rolls are represented by one color and the most frequent rolls
 * are represented by another color.
 */
@Injectable({
    providedIn: 'root',
})
export class ColorService {
    public colorDensityColor = "#184e07"; // Default dark green color for density mapping

    public density = [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0]
    /**
     * highlight colors for the rolls, indicating frequency compared to the others
     * these are the colors used to show the frequency of each roll
     */
    public colorGradients = [
        `rgba(0, 0, 255, ${this.density[0]})`,  // Blue          least frequent (50% opacity)
        `rgba(25, 0, 230, ${this.density[1]})`, // Bluish
        `rgba(51, 0, 204, ${this.density[2]})`, // Blue-Indigo
        `rgba(76, 0, 179, ${this.density[3]})`, // Indigo
        `rgba(102, 0, 153, ${this.density[4]})`, // Blue-Violet
        `rgba(128, 0, 128, ${this.density[5]})`, // Violet
        `rgba(153, 0, 102, ${this.density[6]})`, // Purple
        `rgba(179, 0, 76, ${this.density[7]})`, // Purple-Red
        `rgba(204, 0, 51, ${this.density[8]})`, // Red-Purple
        `rgba(230, 0, 25, ${this.density[9]})`, // Reddish
        `rgba(255, 0, 0, ${this.density[10]})`    // Red           most frequent (100% opacity)
    ];

    /**
     *  these are the 'mapped' colors : which color to use for each roll
     */
    public colorMappedRolls: { [key: number]: string } = [];

    updateRollFrequencyColor(index: number, hexColor: string): void {
        this.colorGradients[index] = this.hexToRgba(hexColor, this.density[index]);
    }

    updateRollFrequencyDensityColor(color: string): void {
        this.colorDensityColor = color;
    }

    public showSampleColors(colorOption: ColorOption) {
        if (colorOption === ColorOption.Density) {
            // Extract RGB components from the current colorDensityColor
            const rgbMatch = this.colorDensityColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
            if (!rgbMatch) {
                console.error('showSampleColors : Invalid color format for colorDensityColor:', this.colorDensityColor);
                return;
            }

            const red = parseInt(rgbMatch[1], 16);
            const green = parseInt(rgbMatch[2], 16);
            const blue = parseInt(rgbMatch[3], 16);

            // Map rolls (2 to 12) to colors with opacity from the density array
            this.colorMappedRolls = {};
            for (let i = 0; i < this.density.length; i++) {
                const roll = i + 2; // Rolls start from 2
                const opacity = this.density[i];
                this.colorMappedRolls[roll] = `rgba(${red}, ${green}, ${blue}, ${opacity})`;
            }
        } else {
            this.colorMappedRolls =  {
                    2: this.colorGradients[0],
                    3: this.colorGradients[1],
                    4: this.colorGradients[2],
                    5: this.colorGradients[3],
                    6: this.colorGradients[4],
                    7: this.colorGradients[5],
                    8: this.colorGradients[6],
                    9: this.colorGradients[7],
                    10: this.colorGradients[8],
                    11: this.colorGradients[9],
                    12: this.colorGradients[10]
                };
        }
    }

    public clearMappedColors() {
        this.colorMappedRolls = {
            2: "#FFFFFF", 3: "#FFFFFF", 4: "#FFFFFF", 5: "#FFFFFF", 6: "#FFFFFF",
            7: "#FFFFFF", 8: "#FFFFFF", 9: "#FFFFFF", 10: "#FFFFFF", 11: "#FFFFFF", 12: "#FFFFFF"
        };
    }

    mapRollFrequencyColor(rollCount: number, colorOption: ColorOption, gameStats: Stats, maxRollCount: number) {
        if (rollCount <= 0) { //  no rolls to process
            this.clearMappedColors();
            return;
        }
        if (colorOption === ColorOption.Density) {
            // Logic for single color with changing density
            this.mapRollsToDensity(gameStats, maxRollCount);
        } else if (colorOption === ColorOption.Color) {
            // Logic for changing colors
            this.mapRollsToColors(gameStats);
        }
    }

    /**
     * Map rolls to a single color with changing density
     */
    private mapRollsToDensity(gameStats: Stats, maxRollCount: number): void {
        // Extract RGB components from the colorDensityColor
        const rgbMatch = this.colorDensityColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (!rgbMatch) {
            console.error('mapRollsToDensity: Invalid color format for colorDensityColor:', this.colorDensityColor);
            return;
        }

        const red = parseInt(rgbMatch[1], 16);
        const green = parseInt(rgbMatch[2], 16);
        const blue = parseInt(rgbMatch[3], 16);

        // Map rolls to density-based colors
        this.colorMappedRolls = Object.keys(gameStats.rolls).reduce((acc: { [key: string]: string }, key) => {
            const density = Math.min(255, Math.floor((gameStats.rolls[Number(key)] / maxRollCount) * 255));
            acc[key] = `rgba(${red}, ${green}, ${blue}, ${density / 255})`; // Use extracted RGB components
            return acc;
        }, {});
    }

    /**
     * Function to map roll counts to a gradient of colors which depict how often each number rolls
     * populates the color mapped rolls object : key is the dice roll, and value is the associated color
     * dice which have been rolled the same number of times get the same color
     * color is based on where the die's count lies within the 11 spread spectrum
     */
    private mapRollsToColors(gameStats: Stats): void {
        this.clearMappedColors(); // Reset the colors before mapping

        // Get the rolls and their frequencies
        const rollKeys = Object.keys(gameStats.rolls).map(Number);

        if (rollKeys.length <= 0) {  //  no rolls to process
            return;
        }

        // Find the maximum and minimum frequencies
        const frequencies = Object.values(gameStats.rolls);
        const maxFrequency = Math.max(...frequencies);
        const minFrequency = Math.min(...frequencies);

        // Calculate colors based on frequency
        rollKeys.forEach((roll) => {
            const frequency = gameStats.rolls[roll];
            if (frequency === maxFrequency) {           // last color/Red for most frequent
                this.colorMappedRolls[roll] = this.colorGradients[this.colorGradients.length - 1];
            } else if (frequency === minFrequency) {    // first color/Green for least frequent
                this.colorMappedRolls[roll] = this.colorGradients[0];
            } else {                                    // Calculate relative color index for intermediate values
                const relativeFrequency = (frequency - minFrequency) / (maxFrequency - minFrequency);
                const colorIndex = Math.round(relativeFrequency * (this.colorGradients.length - 1));
                this.colorMappedRolls[roll] = this.colorGradients[colorIndex];
            }
        });
    }

    getOpacity(rgba: string): number {
        const match = rgba.match(/rgba?\(\d+,\s*\d+,\s*\d+,\s*(\d*\.?\d+)\)/);
        return match ? parseFloat(match[1]) : 1; // Default to full opacity if parsing fails
    }

    hexToRgb (hex: string) {
        if (!hex) {
            console.error('hexToRgb : no hex color passed?!:', hex);
            return {
                r: 255,
                g: 255,
                b: 255,
            };
        }
        const bigint = parseInt(hex.slice(1), 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255,
        };
    };

    hexToRgba (hex: string, opacity: number): string {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    private isHexColor(hex: string): boolean {
        // Regular expression to match valid hex color codes
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        return hexColorRegex.test(hex);
    }

    rgbaToHex(rgba: string): string {
        if(this.isHexColor(rgba)) {
            return rgba; // already hex, no conversion needed
        }
        if (!rgba) {
            console.error('rgbaToHex : Invalid RGBA color:', rgba);
            return '#000000'; // Default to black 
        }
        const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) {            
            console.error('rgbaToHex : Invalid RGBA format:', rgba);
            return '#000000'; // Default to black if parsing fails
        }

        const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
        const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
        const b = parseInt(match[3], 10).toString(16).padStart(2, '0');

        return `#${r}${g}${b}`;
    }

    rgbToHex(r: number, g: number, b: number): string {
        const toHex = (value: number) => value.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    rgbToRgba = (r: number, g: number, b: number, a: number) => {
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
    };

    /**
     * Generate a gradient of colors between two given colors.
     * @param low - The starting color in hexadecimal format (e.g., "#0000FF").
     * @param high - The ending color in hexadecimal format (e.g., "#FF0000").
     * @param steps - The number of intermediate colors to generate.
     * @returns An array of colors in hexadecimal format.
     */
    public generateGradient(low: string, high: string, steps: number = 8): void {
        if(!low) {
            console.error("generateGradient: low color is missing!");
            return;
        }
        if(!high) {
            console.error("generateGradient: high color is missing!");
            return;
        }
        if(low.startsWith('rgba')) low = this.rgbaToHex(low);
        if(high.startsWith('rgba')) high = this.rgbaToHex(high);
        
        const start = this.hexToRgb(low);
        const end = this.hexToRgb(high);
        const gradient: string[] = [];

        // Add the low color with starting opacity
        gradient.push(this.rgbToRgba(start.r, start.g, start.b, this.density[0])); // Use the density for opacity

        for (let i = 0; i <= steps; i++) {
            const r = Math.round(start.r + ((end.r - start.r) * i) / steps);
            const g = Math.round(start.g + ((end.g - start.g) * i) / steps);
            const b = Math.round(start.b + ((end.b - start.b) * i) / steps);
            
            gradient.push(this.rgbToRgba(r, g, b, this.density[i+1])); // Use the density for opacity
        }

        // Add the high color with ending opacity
        gradient.push(this.rgbToRgba(end.r, end.g, end.b, this.density[this.density.length - 1])); // Use the density for opacity
        
        //return gradient;
        this.colorGradients = gradient; // Update the color gradients
    }
}