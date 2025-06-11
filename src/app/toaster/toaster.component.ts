import { Component, AfterViewChecked, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToasterService } from '../services/toaster.service';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngFor="let toast of toaster.toasts; let i = index"
     class="toast center"
     [style.top.px]="calcCenterStackTop(i, toaster.toasts.length)"
     [style.width.px]="toast.width"
     #toastElem
     (click)="toast.sticky && toaster.dismiss(toast.id)">
  {{ toast.message }}
    </div>
  `,
  styleUrls: ['toaster.component.css']
})

export class ToasterComponent implements AfterViewChecked {
  @ViewChildren('toastElem', { read: ElementRef }) toastElems!: QueryList<ElementRef>;
  constructor(public toaster: ToasterService) { }

  ngAfterViewChecked() {
    // For each toast, if width is not set, measure and set it
    this.toastElems.forEach((elemRef, idx) => {
      const toast = this.toaster.toasts[idx];
      if (toast && !toast.width) {
        // Use getBoundingClientRect for accurate width
        toast.width = elemRef.nativeElement.getBoundingClientRect().width;
      }
    });
  }

  calcCenterStackTop(i: number, total: number): number {
    const base = window.innerHeight / 2;
    const offset = (i - (total - 1) / 2) * 60; // 60px per toast
    return base + offset;
  }
}