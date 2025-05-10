import { Injectable } from '@angular/core';
import { PlayStats } from './gameStats';
import { ColorOption } from './color-option.enum'; // Import the enum

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
    /**
     * highlight colors for the rolls, indicating frequency compared to the others
     */
    private readonly colorGradients = [
        "#FFFF00",  // Yellow  (least frequent)
        "#FFA500",  // Orange
        "#FF00FF",  // Magenta
        "#FF0000",  // Red
        "#800080",  // Purple
        "#800000",  // Maroon
        "#808013",  // Green
        "#5e5e02",  // Olive
        "#056324",  // Cyan
        "#064179",  // Teal
        "#0000FF"   // Blue  (most frequent)
    ];
    /**
     *  start by showing all possible colors
     */
    private defaultRollCountColors: { [key: number]: string } = {
        2: this.colorGradients[0],  // Yellow
        3: this.colorGradients[1],  // Orange
        4: this.colorGradients[2],  // Magenta
        5: this.colorGradients[3],  // Red
        6: this.colorGradients[4],  // Purple
        7: this.colorGradients[5],  // Maroon
        8: this.colorGradients[6],  // Olive
        9: this.colorGradients[7],  // Green
        10: this.colorGradients[8],  // Cyan
        11: this.colorGradients[9],  // Teal
        12: this.colorGradients[10]  // Blue
    };

    public colorMappedRolls: { [key: number]: string } = this.defaultRollCountColors;

    public clearMappedColors() {
        this.colorMappedRolls = {
            2: "#FFFFFF", 3: "#FFFFFF", 4: "#FFFFFF", 5: "#FFFFFF", 6: "#FFFFFF",
            7: "#FFFFFF", 8: "#FFFFFF", 9: "#FFFFFF", 10: "#FFFFFF", 11: "#FFFFFF", 12: "#FFFFFF"
        };
    }

    mapRollFrequencyColor(rollCount: number, colorOption: ColorOption, gameStats: PlayStats, maxRollCount: number) {
        if (rollCount <= 0) { //  no rolls to process
            this.clearMappedColors(); // Reset the colors before mapping
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
    private mapRollsToDensity(gameStats: PlayStats, maxRollCount: number): void {
        // Example logic for density-based coloring
        this.colorMappedRolls = Object.keys(gameStats.rolls).reduce((acc: { [key: string]: string }, key) => {
            const density = Math.min(255, Math.floor((gameStats.rolls[Number(key)] / maxRollCount) * 255));
            acc[key] = `rgba(0, ${density}, 0, ${density / 255})`; // Green with varying intensity and opacity
            return acc;
        }, {});
    }

    /**
     * Function to map roll counts to a gradient of colors which depict how often each number rolls
     * populates the color mapped rolls object : key is the dice roll, and value is the associated color
     * dice which have been rolled the same number of times get the same color
     * color is based on where the die's count lies within the 11 spread spectrum
     */
    private mapRollsToColors(gameStats: PlayStats): void {
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

}