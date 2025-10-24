import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Import ALL necessary PrimeNG modules
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { MeterGroupModule } from 'primeng/metergroup';
import { ChartModule } from 'primeng/chart';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DataViewModule } from 'primeng/dataview'; // Included for the Panel Health section (if needed)

@Component({
    selector: 'app-solardashboard',
    // Define as a Standalone Component
    standalone: true,
    imports: [
        // Angular Common Modules
        CommonModule,
        FormsModule,

        // PrimeNG Modules
        TagModule,
        CardModule,
        ProgressBarModule,
        MeterGroupModule,
        ChartModule,
        PanelModule,
        ButtonModule,
        DividerModule,
        ToggleSwitchModule,
        DataViewModule
    ],
    templateUrl: './solardashboard.html',
    styleUrls: ['./solardashboard.scss']
})
export class SolarDashboard implements OnInit {
    // --- Real-time Data Points ---
    luxValue: number = 850; // W/m2 (Sunlight Intensity)
    totalDCPower: number = 4.5; // kW (Total DC Power at Junction)
    totalACPower: number = 4.2; // kW (Power Produced from Inverter)
    breakerStatus: boolean = true; // ON/OFF
    inverterTemp: number = 45.2; // °C
    inverterLoad: number = 85; // %
    inverterStatus: string = 'Running'; // Inverter Status
    performanceRatio: number = 0.78; // 78% PR

    // Array for individual panel data
    panelData = [
        { id: 1, power: 350, status: 'OK' },
        { id: 2, power: 345, status: 'OK' },
        { id: 3, power: 300, status: 'OK' },
        { id: 4, power: 210, status: 'Shaded' },
        { id: 5, power: 330, status: 'OK' },
        { id: 6, power: 0, status: 'Fault' }
    ];

    // Chart data for historical production (PrimeNG ChartModule)
    dailyProductionChartData: any;
    chartOptions: any;

    ngOnInit() {
        this.dailyProductionChartData = {
            labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
            datasets: [
                {
                    label: 'AC Power (kW)',
                    data: [0.5, 3.2, 4.2, 3.8, 1.5, 0.1],
                    backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500 equivalent
                    borderColor: '#3b82f6', // blue-500
                    pointBackgroundColor: '#3b82f6',
                    tension: 0.4,
                    fill: true
                }
            ]
        };

        this.chartOptions = {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#9ca3af' // gray-400 for dark mode compatibility
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: '#374151' } // gray-700
                },
                y: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: '#374151' }
                }
            }
        };
    }

    // --- Helper Methods for Template Styling/Logic ---

    /**
     * Applies Tailwind CSS classes for background color based on metric value and threshold.
     * This is what was causing the previous errors and is now properly exposed.
     */
    public getMetricColor(value: number, threshold: number, type: 'low' | 'high'): string {
        if (type === 'high') {
            // Alert if value EXCEEDS threshold (e.g., high temperature)
            return value > threshold ? 'bg-red-500' : 'bg-green-500';
        }
        if (type === 'low') {
            // Alert if value FALLS BELOW threshold (e.g., low PR or low power)
            return value < threshold ? 'bg-red-500' : 'bg-green-500';
        }
        return 'bg-blue-500';
    }

    /**
     * Checks if the inverter temperature is too high.
     */
    public isTempAlert(): boolean {
        return this.inverterTemp > 55;
    }

    /**
     * Returns the color class for the inverter status tag.
     */
    public getInverterStatusColor(): string {
        switch (this.inverterStatus) {
            case 'Running':
                return 'bg-green-500';
            case 'Fault':
                return 'bg-red-500';
            default:
                return 'bg-yellow-500';
        }
    }
}
