import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { ProgressBarModule } from 'primeng/progressbar';
import { OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ToggleSwitch } from 'primeng/toggleswitch'; // ✨ IMPORT THIS
import { FormsModule } from '@angular/forms'; // Import FormsModule

type PrimeBadgeSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
    selector: 'app-tank-dashboard',
    standalone: true,
    imports: [CardModule, BadgeModule, ProgressBarModule, DecimalPipe, ToggleSwitch, FormsModule],
    templateUrl: './tankcontrol.html'
})
export class Tankcontrol implements OnInit {
    // --- TANK DIMENSIONS AND VOLUME CALCULATION ---
    private TANK_LENGTH_M = 25;
    private TANK_WIDTH_M = 25;
    private TANK_DEPTH_M = 1.5;

    public pumpOn: boolean = false;

    public TANK_CAPACITY_L = this.TANK_LENGTH_M * this.TANK_WIDTH_M * this.TANK_DEPTH_M * 1000;
    public TANK_CAPACITY_M = this.TANK_LENGTH_M * this.TANK_WIDTH_M * this.TANK_DEPTH_M;

    // --- CORE DATA (as numbers for calculations) ---
    private inletFlowRateLPM = 1800;
    private waterLevelPct = 1;

    private pipeData = [
        { name: 'OUT_A', flowLPM: 6, severity: 'success' as PrimeBadgeSeverity },
        { name: 'OUT_B', flowLPM: 4, severity: 'success' as PrimeBadgeSeverity },
        { name: 'OUT_C', flowLPM: 8, severity: 'warn' as PrimeBadgeSeverity },
        { name: 'OUT_D', flowLPM: 4, severity: 'success' as PrimeBadgeSeverity }
    ];

    configTarget: string = '';
    configTargetZone: string = '';

    public ngOnInit(): void {
        this.configTarget = localStorage.getItem('configTarget') || '';
        this.configTargetZone = localStorage.getItem('configTargetZone') || '';
    }

    // --- CALCULATIONS ---

    private formatTime(minutes: number): string {
        if (minutes <= 0) return '0 min';

        let days = Math.floor(minutes / 1440); // 1440 minutes in a day
        let hours = Math.floor((minutes % 1440) / 60);
        let mins = Math.round(minutes % 60);

        let timeString = '';
        if (days > 0) timeString += `${days} d `;
        if (hours > 0 || days > 0) timeString += `${hours} hr `;
        timeString += `${mins} min`;

        return timeString.trim();
    }

    // 1. Calculate Time to Fill (Reused from previous step)
    private calculateTimeToFill(currentLevelPct: number, inletRateLPM: number): string {
        if (currentLevelPct >= 100) return 'Full';
        if (inletRateLPM === 0) return 'Pump Off';

        const volumeRemaining = this.TANK_CAPACITY_L * (1 - currentLevelPct / 100);
        const minutesToFill = volumeRemaining / inletRateLPM;

        return this.formatTime(minutesToFill);
    }

    // 2. Calculate Total Outlet Flow Rate
    private totalOutletRateLPM = this.pipeData.reduce((sum, pipe) => sum + pipe.flowLPM, 0);

    // 3. Calculate Time to Drain Completely
    private calculateTimeToDrain(currentLevelPct: number, totalOutletRateLPM: number): string {
        if (currentLevelPct <= 0) return 'Empty';
        if (totalOutletRateLPM === 0) return 'Valves Closed';

        // Volume currently in the tank
        const currentVolume = this.TANK_CAPACITY_L * (currentLevelPct / 100);

        // Total minutes to drain
        const minutesToDrain = currentVolume / totalOutletRateLPM;

        return this.formatTime(minutesToDrain);
    }

    // Final calculated values
    private timeToFill = this.calculateTimeToFill(this.waterLevelPct, this.inletFlowRateLPM);
    private timeToDrain = this.calculateTimeToDrain(this.waterLevelPct, this.totalOutletRateLPM); // ✨ NEW

    // --- DASHBOARD CARDS ARRAY (FINAL STRUCTURE) ---
    public dashboardCards = [
        {
            title: 'INLET PUMP 1',
            icon: 'pi pi-bolt',
            status: 'ON',
            flowRate: this.inletFlowRateLPM,
            powerConsumption: '1.5 kW',
            powerHz: '50',
            timeToFill: this.timeToFill,
            type: 'pump'
        },
        {
            title: 'WATER LEVEL %',
            icon: 'pi pi-sort-down',
            value: this.waterLevelPct,
            displayValue: `${this.waterLevelPct}%`,
            timeToDrain: this.timeToDrain, // ✨ NEW PROPERTY ADDED HERE
            type: 'level'
        },
        {
            title: 'OUTLET PIPE FLOW RATE',
            icon: 'pi pi-download',
            totalRate: `${this.totalOutletRateLPM} L/min`, // Display total rate
            type: 'multiple',
            pipes: this.pipeData.map((p) => ({
                name: p.name,
                flow: `${p.flowLPM} L/min`,
                severity: p.severity
            }))
        }
    ];

    public convertTom3(permin: any) {
        permin = permin * 60;
        return permin;
    }
}
