import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms'; // Added FormsModule just in case you add more interactivity later

// --- Interfaces for Mock Data Structure ---
interface ForecastResult {
    monthIndex: number; // 0=This Month (Oct), 1=Next Month (Nov), etc.
    product: string;
    tonnes: number;
}

interface StockingEvent {
    tankId: string;
    product: 'Tilapia' | 'Red Tilapia' | 'Vanamei';
    stockDate: Date;
    initialStock: number;
    projectedWeightKg: number;
    projectedSurvivalRate: number;
}

// --- Mock Data Class (Replaces the Service) ---
class MockForecastData {
    private readonly GROWOUT_DAYS = 150; // 5 months growout time

    // CHANGED to 'public' to be accessible by getActiveStockingCount() in the component
    public getCurrentStockingEvents(): StockingEvent[] {
        // Mock data assumes the current date is October 23, 2025 (10/23/2025)

        return [
            // Ready Next Month (Month 1: November) - Approx. 4 months old
            { tankId: 'Z1-T1', product: 'Tilapia', stockDate: new Date('2025-06-23'), initialStock: 5000, projectedWeightKg: 0.8, projectedSurvivalRate: 0.9 },
            { tankId: 'Z4-T2', product: 'Vanamei', stockDate: new Date('2025-06-25'), initialStock: 120000, projectedWeightKg: 0.03, projectedSurvivalRate: 0.75 },

            // Ready in 2 Months (Month 2: December) - Approx. 3 months old
            { tankId: 'Z2-T3', product: 'Red Tilapia', stockDate: new Date('2025-07-10'), initialStock: 4500, projectedWeightKg: 0.9, projectedSurvivalRate: 0.85 },
            { tankId: 'Z1-T3', product: 'Tilapia', stockDate: new Date('2025-07-28'), initialStock: 6000, projectedWeightKg: 0.75, projectedSurvivalRate: 0.92 },

            // Ready in 3 Months (Month 3: January) - Approx. 2 months old
            { tankId: 'Z3-T4', product: 'Tilapia', stockDate: new Date('2025-08-15'), initialStock: 5500, projectedWeightKg: 0.85, projectedSurvivalRate: 0.88 },
            { tankId: 'Z2-T1', product: 'Vanamei', stockDate: new Date('2025-08-20'), initialStock: 150000, projectedWeightKg: 0.025, projectedSurvivalRate: 0.8 },

            // Ready in 4+ Months (Ignored by the 3-month forecast table, but still an active tank)
            { tankId: 'Z4-T4', product: 'Red Tilapia', stockDate: new Date('2025-09-20'), initialStock: 4800, projectedWeightKg: 0.95, projectedSurvivalRate: 0.8 }
        ];
    }

    public getForecast(today: Date): ForecastResult[] {
        const events = this.getCurrentStockingEvents();
        const results: { monthIndex: number; product: string; tonnes: number }[] = [];

        events.forEach((event) => {
            const timeDiff = today.getTime() - event.stockDate.getTime();
            const daysAged = Math.floor(timeDiff / (1000 * 3600 * 24));
            const daysRemaining = this.GROWOUT_DAYS - daysAged;

            // Calculation: (Stock * Survival Rate * Weight per unit) / 1000 = Tonnes
            const harvestTonnes = (event.initialStock * event.projectedSurvivalRate * event.projectedWeightKg) / 1000;

            let monthIndex: number;

            // Determine the month offset for the next 4 months (0, 1, 2, 3)
            if (daysRemaining <= 0) {
                monthIndex = 0;
            } else if (daysRemaining <= 31) {
                monthIndex = 1;
            } else if (daysRemaining <= 62) {
                monthIndex = 2;
            } else if (daysRemaining <= 93) {
                monthIndex = 3;
            } else {
                monthIndex = 4;
            }

            if (monthIndex <= 3) {
                results.push({
                    monthIndex: monthIndex,
                    product: event.product,
                    tonnes: harvestTonnes
                });
            }
        });

        // Aggregate by product and month
        const aggregated = new Map<string, number>();
        results.forEach((item) => {
            const key = `${item.product}|${item.monthIndex}`;
            const currentTonnes = aggregated.get(key) || 0;
            aggregated.set(key, currentTonnes + item.tonnes);
        });

        return Array.from(aggregated, ([key, tonnes]) => {
            const [product, monthIndexStr] = key.split('|');
            return {
                monthIndex: parseInt(monthIndexStr),
                product: product,
                tonnes: tonnes
            };
        });
    }

    public getMonthName(monthOffset: number): string {
        const date = new Date();
        date.setMonth(date.getMonth() + monthOffset);
        return date.toLocaleString('en-US', { month: 'short' });
    }
}

@Component({
    selector: 'app-forecast',
    standalone: true,
    imports: [CommonModule, ChartModule, TableModule, CardModule, DividerModule, TagModule, FormsModule],
    templateUrl: './forecast.html',
    // Note: Using the provided Tailwind style classes in the HTML, no separate CSS needed for basic styling
    styleUrls: ['./forecast.scss']
})
export class ForecastComponent implements OnInit {
    forecastData: ForecastResult[] = [];
    productTypes: string[] = [];
    monthColumns: { field: string; header: string; total: number }[] = [];
    chartData: any;
    chartOptions: any;
    totalForecastTonnes: number = 0;

    private mockData = new MockForecastData();

    ngOnInit() {
        this.loadForecast();
        this.setupChart();
    }

    loadForecast() {
        this.forecastData = this.mockData.getForecast(new Date());

        // 1. Determine Unique Products
        this.productTypes = [...new Set(this.forecastData.map((f) => f.product))];

        // 2. Set up Dynamic Columns (Month 0, 1, 2, 3)
        this.monthColumns = [0, 1, 2, 3].map((i) => ({
            field: `month_${i}`,
            header: this.mockData.getMonthName(i),
            total: 0
        }));

        // 3. Calculate Total Forecast for the period
        this.totalForecastTonnes = this.forecastData.reduce((sum, item) => sum + item.tonnes, 0);
    }

    /**
     * Transforms the flat forecast data into rows suitable for p-table.
     * Also calculates column totals on the fly.
     */
    getAggregatedTableData(): any[] {
        const tableData: any[] = [];
        const columnTotals: { [key: string]: number } = this.monthColumns.reduce((acc, col) => ({ ...acc, [col.field]: 0 }), {});

        this.productTypes.forEach((product) => {
            const row: any = { product: product, totalTonnes: 0 };

            this.monthColumns.forEach((col) => {
                const forecast = this.forecastData.find((f) => f.product === product && f.monthIndex === this.getMonthIndexFromField(col.field));
                const tonnes = forecast ? parseFloat(forecast.tonnes.toFixed(2)) : 0;

                row[col.field] = tonnes;
                row.totalTonnes += tonnes;
                columnTotals[col.field] += tonnes; // Accumulate column total
            });
            tableData.push(row);
        });

        // Update totals in monthColumns property for use in the table footer
        this.monthColumns.forEach((col) => {
            col.total = parseFloat(columnTotals[col.field].toFixed(2));
        });

        return tableData;
    }

    private getMonthIndexFromField(field: string): number {
        return parseInt(field.split('_')[1]);
    }

    setupChart() {
        const tableData = this.getAggregatedTableData();
        const labels = this.monthColumns.map((c) => c.header);

        const productColors: { [key: string]: string } = {
            Tilapia: '#3b82f6',
            'Red Tilapia': '#ef4444',
            Vanamei: '#10b981'
        };

        this.chartData = {
            labels: labels,
            datasets: this.productTypes.map((product) => ({
                label: product,
                data: [0, 1, 2, 3].map((i) => tableData.find((row) => row.product === product)?.[`month_${i}`] || 0),
                backgroundColor: productColors[product],
                borderColor: productColors[product],
                fill: true,
                tension: 0.4
            }))
        };

        this.chartOptions = {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: 'rgb(156 163 175)'
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: 'rgb(156 163 175)' },
                    grid: { color: 'rgb(55 65 81)' }
                },
                y: {
                    stacked: true,
                    ticks: { color: 'rgb(156 163 175)' },
                    grid: { color: 'rgb(55 65 81)' }
                }
            }
        };
    }

    public getMonthName(monthOffset: number): string {
        return this.mockData.getMonthName(monthOffset);
    }

    // This now works because MockForecastData.getCurrentStockingEvents is public.
    public getActiveStockingCount(): number {
        return this.mockData.getCurrentStockingEvents().length;
    }

    public get nextHarvestMonthName(): string {
        const nextMonth = this.monthColumns.find((c) => c.total > 0);
        return nextMonth ? nextMonth.header.toUpperCase() : 'N/A';
    }
}
