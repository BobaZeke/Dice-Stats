export interface Toast {
  id: number;
  message: string;
  state: 'center' | 'slide-right' | 'float-top';
  sticky?: boolean;
  width?: number; 
}