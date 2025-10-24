import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ChartModule } from 'primeng/chart';

// Define the required data structure for the historical records
export interface FirestoreDoc {
    id: string;
    currentStock: string;
    date_epoch: number;
    do: number; // Dissolved Oxygen
    nh4: number; // Ammonia
    ph: number;
    releaseDate: number;
    salinity: number;
    stockDate: number;
    tankId: string;
    temp_c: number; // Temperature in Celsius
    timestamp: number;
    turbidity: number;
    waterlevel: number;
}

@Component({
    selector: 'app-tankhistory',
    standalone: true,
    // Added ChartModule to imports
    imports: [CommonModule, DatePipe, ChartModule],
    // <---- ADDED providers array to provide the DatePipe instance
    providers: [DatePipe],
    templateUrl: './tankhistory.html',
    styles: [
        `
            :host {
                display: block;
                font-family: 'Inter', sans-serif;
                background-color: #f3f4f6;
                min-height: 100vh;
            }
        `
    ]
})
export class Tankhistory implements OnInit, AfterViewInit {
    // Injecting the DatePipe now requires it to be provided (see above)
    private datePipe = inject(DatePipe);

    // Properties now hardcoded for mock data independence
    zoneId: string = 'zone_A'; // Hardcoded value
    tankId: string = 'A1'; // Hardcoded value

    // Data and Chart properties for PrimeNG
    historicalData: FirestoreDoc[] = [];
    public chartData: any;
    public chartOptions: any;

    ngOnInit() {
        // 1. Generate mock data for the last 24 hours using the hardcoded tankId
        this.historicalData = this._generateMockHistoricalData(this.tankId);
    }

    ngAfterViewInit() {
        // 2. Prepare Chart data and options after the view is ready
        if (this.historicalData.length > 0) {
            this._prepareChartConfiguration();
        }
    }

    // --- Mock Data Generation ---
    private _generateMockHistoricalData(tankId: string): FirestoreDoc[] {
        const data: FirestoreDoc[] = [];
        const now = Date.now();
        const hourInMs = 3600 * 1000;
        const totalHours = 24;

        // Base values for simulation (typical aquaculture ranges)
        const baseTemp = 27.5; // Temperature (°C)
        const basePh = 7.5; // pH
        const baseDo = 5.5; // Dissolved Oxygen (mg/L)
        const baseSalinity = 30.0; // ppt
        const baseTurbidity = 40.0; // NTU
        const baseWaterlevel = 95.0; // %

        for (let i = totalHours - 1; i >= 0; i--) {
            const timestamp = now - i * hourInMs;

            // Generate values with fluctuations around the base
            const temp_c = parseFloat((baseTemp + (Math.random() * 2 - 1) * 1.0).toFixed(1)); // ±1.0
            const ph = parseFloat((basePh + (Math.random() * 2 - 1) * 0.3).toFixed(2)); // ±0.3
            const doValue = parseFloat((baseDo + (Math.random() * 2 - 1) * 0.8).toFixed(2)); // ±0.8
            const salinity = parseFloat((baseSalinity + (Math.random() * 2 - 1) * 1.0).toFixed(1)); // ±1.0
            // Ammonia is kept very low, simulating a healthy system (0.000 to 0.100 ppm)
            const nh4 = parseFloat((Math.random() * 0.1).toFixed(3));
            const turbidity = parseFloat((baseTurbidity + (Math.random() * 2 - 1) * 15).toFixed(1)); // ±15
            const waterlevel = parseFloat((baseWaterlevel + (Math.random() * 2 - 1) * 2).toFixed(1)); // ±2

            data.push({
                id: `rec-${i}-${tankId}`,
                currentStock: 'Shrimp',
                date_epoch: Math.floor(timestamp / 1000),
                do: doValue,
                nh4: nh4,
                ph: ph,
                releaseDate: 0,
                salinity: salinity,
                stockDate: 0,
                tankId: tankId,
                temp_c: temp_c,
                timestamp: timestamp,
                turbidity: turbidity,
                waterlevel: waterlevel
            });
        }
        return data;
    }

    // --- Chart Initialization ---
    private _prepareChartConfiguration(): void {
        const labels = this.historicalData.map((doc) =>
            // Using the injected datePipe instance
            this.datePipe.transform(doc.timestamp, 'MMM d, HH:mm')
        );

        const tempData = this.historicalData.map((doc) => doc.temp_c);
        const phData = this.historicalData.map((doc) => doc.ph);
        const doData = this.historicalData.map((doc) => doc.do);

        this.chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: tempData,
                    borderColor: 'rgb(54, 162, 235)', // Blue
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'yTemp',
                    pointRadius: 3
                },
                {
                    label: 'Dissolved Oxygen (mg/L)',
                    data: doData,
                    borderColor: 'rgb(75, 192, 192)', // Teal/Green
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'yDo', // New Axis
                    borderDash: [5, 5], // Dashed line for distinction
                    pointRadius: 2
                },
                {
                    label: 'pH Level',
                    data: phData,
                    borderColor: 'rgb(255, 99, 132)', // Red
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'yPh',
                    pointRadius: 3
                }
            ]
        };

        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `24-Hour Historical Data for Tank ${this.tankId}`,
                    color: textColor
                },
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Time', color: textColorSecondary },
                    ticks: { color: textColorSecondary, autoSkip: true, maxTicksLimit: 7 },
                    grid: { color: surfaceBorder }
                },
                yTemp: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Temperature (°C)', color: 'rgb(54, 162, 235)' },
                    ticks: { color: 'rgb(54, 162, 235)', suggestedMin: 25, suggestedMax: 30 },
                    grid: { color: surfaceBorder }
                },
                yDo: {
                    type: 'linear',
                    display: true,
                    position: 'left', // Sharing the left side with Temp
                    title: { display: true, text: 'D.O. (mg/L)', color: 'rgb(75, 192, 192)' },
                    ticks: { color: 'rgb(75, 192, 192)', suggestedMin: 4.0, suggestedMax: 7.0 },
                    grid: { drawOnChartArea: false } // Avoid cluttering the chart
                },
                yPh: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'pH Level', color: 'rgb(255, 99, 132)' },
                    ticks: { color: 'rgb(255, 99, 132)', suggestedMin: 6.5, suggestedMax: 8.0 },
                    grid: { drawOnChartArea: false } // Avoid cluttering the chart
                }
            }
        };
    }
}
