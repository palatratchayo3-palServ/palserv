import { Component } from '@angular/core';
import { Farmzonedash } from '../dashboard/components/farmzonedash/farmzonedash';

@Component({
    selector: 'app-dashboard',
    imports: [Farmzonedash],
    template: `
        <div class="col-span-12 xl:col-span-6">
            <app-farmzonedash class="content"></app-farmzonedash>
            <div class="col-span-12 xl:col-span-6"></div>
            <div class="col-span-12 xl:col-span-6"></div>
        </div>
    `
})
export class Dashboard {}
