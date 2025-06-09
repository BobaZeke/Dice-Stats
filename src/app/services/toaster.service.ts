import { Injectable } from '@angular/core';
import { Toast } from '../models/toast';

@Injectable({ providedIn: 'root' })
export class ToasterService {
  private nextId = 1;
  public toasts: Toast[] = [];

  show(message: string, sticky: boolean = false) {
    const toast: Toast = { id: this.nextId++, message, state: 'center', sticky };
    this.toasts.push(toast);

    setTimeout(() => {
      toast.state = 'slide-right';
    }, 5500);

    setTimeout(() => {
      toast.state = 'float-top';
    }, 1700); // 500ms + 1200ms

    if (!sticky) {
      setTimeout(() => {
        this.dismiss(toast.id);
      }, 5000);
    }
  }

  dismiss(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}