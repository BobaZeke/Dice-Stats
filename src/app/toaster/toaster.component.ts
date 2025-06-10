import { Component, AfterViewChecked, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToasterService } from '../services/toaster.service';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngFor="let toast of toaster.toasts; let i = index"
     class="toast"
     [class.center]="toast.state === 'center'"
     [class.slideRight]="toast.state === 'slide-right'"
     [class.floatTop]="toast.state === 'float-top'"
     [style.top.px]="toast.state === 'float-top' ? (32 + i * 60) : '50%'"
     [style.width.px]="toast.width"
     #toastElem
     (click)="toast.sticky && toaster.dismiss(toast.id)">
      {{ toast.message }}
      <!-- <span *ngIf="toast.sticky" style="margin-left:1em;font-size:1.1em;opacity:0.7;">(Click to dismiss)</span> -->
    </div>
  `,
  styleUrls: ['toaster.component.css']
})

export class ToasterComponent implements AfterViewChecked {
  @ViewChildren('toastElem', { read: ElementRef }) toastElems!: QueryList<ElementRef>;
  constructor(public toaster: ToasterService) {}

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
}