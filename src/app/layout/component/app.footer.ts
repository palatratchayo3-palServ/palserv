import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        SAKAI by
        <a href="https://google.co.th" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">PalservNG</a>
    </div>`
})
export class AppFooter {}
