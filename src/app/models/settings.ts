import { ColorOption } from "./color-option.enum";
import { ColorService } from "../services/color.service";

export class Settings {
    public playSounds: boolean; // Flag to control sound playback
    public showDiceCounts: boolean; // Flag to control the count display vs. percentage
    public colorOption: ColorOption; // Default option
    public colorDensityColor: string; // Default color for density
    public colorGradients: string[]; // Default gradients
    public fixedColors: boolean; // Flag to control fixed colors

    constructor() {
      this.playSounds = true; // Flag to control sound playback
      this.showDiceCounts = true; // Flag to control the count display vs. percentage
      this.colorOption = ColorOption.Color; // Default option
      this.colorDensityColor = new ColorService().colorDensityColor; // Default color for density
      this.colorGradients = new ColorService().colorGradients; // Default gradients
      this.fixedColors = true; // Flag to control fixed (default) colors vs. gradiewnt colors (from settings)
    }
  }