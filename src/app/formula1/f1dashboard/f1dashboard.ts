import { Component } from '@angular/core';
import { F1Upcoming } from './upcoming';

@Component({
    selector: 'app-f1dashboard',
    imports: [F1Upcoming],
    templateUrl: './f1dashboard.html',
    styleUrl: './f1dashboard.scss',
    standalone: true
})
export class F1dashboard {}
