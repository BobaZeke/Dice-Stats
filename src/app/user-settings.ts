import { ColorOption } from "./color-option.enum";

export class UserSettings {
    public playSounds: boolean = true; // Flag to control sound playback
    public showTooltips: boolean = true; // Flag to control the visibility of the tooltips  
    public colorOption: ColorOption = ColorOption.Density; // Default option
  }