import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-dialog',
  template: `
    <div class="dialog-backdrop">
      <div class="dialog-box">
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
        <div class="dialog-actions">
          <button (click)="onOk()">OK</button>
          <button (click)="onCancel()">Cancel</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['dialog.component.css']
})
export class DialogComponent {
  @Input() title = '';
  @Input() message = '';
  @Output() ok = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onOk() { this.ok.emit(); }
  onCancel() { this.cancel.emit(); }
}