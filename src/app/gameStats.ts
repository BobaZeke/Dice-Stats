 export class PlayStats {
   
    /** tracks the history of the rolls (in order) */
    public rollHistory: number[] = [];
        
    /** stores what numbers have been rolled, and how often */
    public rolls: { [key: number]: number } = {};
 
    /** tracks game duration */
    public playingDurationDisplay: string = "";
    
    /** tracks the total time spent on break */
    public breakDurationDisplay: string = "";
 }