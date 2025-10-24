import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { DataCacheService } from '../../../../palservices/realtimeservice/realtime_subscriber.service';
import { ProgressBarModule } from 'primeng/progressbar';
import { Subscription } from 'rxjs';
import { Divider } from 'primeng/divider';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-farmzonedash',
    standalone: true,
    imports: [CommonModule, ProgressBarModule, CardModule, Divider, ButtonModule, Divider],
    templateUrl: './farmzonedash.html',
    styleUrls: ['./farmzonedash.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Farmzonedash implements OnInit, OnDestroy {
    // Properties for data synchronization and cleanup
    private currentCacheDataString: string | null = null;
    private internalUpdateSubscription!: Subscription;
    private storageEventListener: (event: StorageEvent) => void;
    private router = inject(Router);

    // Data properties
    zoneData: any;
    public ZONES = ['zone_A', 'zone_B', 'zone_C', 'zone_D'];
    public dashboardData: any;
    MS_IN_DAY = 1000 * 60 * 60 * 24;

    // Inject services in the constructor for robust typing (best practice)
    constructor(
        private cdRef: ChangeDetectorRef,
        private dataCacheService: DataCacheService
    ) {
        // Initialize the bound event listener property
        this.storageEventListener = this.handleStorageChange.bind(this);
    }

    public ngOnInit(): void {
        this.initializeData();

        // 1. Listen for external updates (other tabs)
        window.addEventListener('storage', this.storageEventListener);

        // 2. 💡 FINAL FIX: Use BRACKET NOTATION to access the property, bypassing the index signature error.
        this.internalUpdateSubscription = (this.dataCacheService as any)['cacheUpdated$'].subscribe(() => {
            this.handleInternalUpdate();
        });

        if (!(this.zoneData && typeof this.zoneData === 'object')) {
            console.error('DataCacheService returned null or invalid data.');
            this.zoneData = {};
        }
    }

    private initializeData(): void {
        this.zoneData = this.dataCacheService.getCachedData();
        this.currentCacheDataString = localStorage.getItem('app_data_cache');
    }

    // --- Same-Tab Update Handler (via RxJS Subject) ---
    private handleInternalUpdate(): void {
        // 1. Read the LATEST PARSED data
        const newData = this.dataCacheService.getCachedData();

        // 2. 💡 FIX: FORCE IMMUTABILITY. Assign a shallow copy to guarantee OnPush re-render.
        this.zoneData = { ...newData };

        // 3. Update the comparison string for the NEXT external check
        this.currentCacheDataString = localStorage.getItem('app_data_cache');

        // 4. Force re-render
        this.cdRef.detectChanges();
        console.log('Dashboard re-rendered due to SAME-TAB service update (Immutability Enforced).');
    }

    // --- Cross-Tab Update Handler (via Storage Event) ---
    private handleStorageChange(event: StorageEvent): void {
        if (event.key === 'app_data_cache') {
            const newCacheDataString = localStorage.getItem('app_data_cache');

            // Compare raw strings for definitive change
            if (newCacheDataString !== this.currentCacheDataString) {
                this.currentCacheDataString = newCacheDataString;

                if (newCacheDataString) {
                    try {
                        // 1. Read the LATEST PARSED data
                        const newData = this.dataCacheService.getCachedData();

                        // 2. 💡 FIX: FORCE IMMUTABILITY. Assign a shallow copy to guarantee OnPush re-render.
                        this.zoneData = { ...newData };
                    } catch (e) {
                        console.error('Failed to parse updated cache data', e);
                        this.zoneData = {};
                    }
                } else {
                    this.zoneData = {};
                }

                this.cdRef.detectChanges();
                console.log('Dashboard re-rendered due to EXTERNAL storage update (Immutability Enforced).');
            }
        }
    }

    // --- Cleanup ---
    ngOnDestroy(): void {
        window.removeEventListener('storage', this.storageEventListener);
        if (this.internalUpdateSubscription) {
            this.internalUpdateSubscription.unsubscribe();
        }
    }

    // --- Getters and Utility Methods (Unchanged) ---
    get zones() {
        if (!this.zoneData || Object.keys(this.zoneData).length === 0) {
            return [];
        }
        return Object.keys(this.zoneData).map((key) => ({
            zoneName: key,
            tanks: Array.isArray(this.zoneData[key as keyof typeof this.zoneData]) ? this.zoneData[key as keyof typeof this.zoneData] : []
        }));
    }

    public getSensorCardClasses(value: number, type: string): string {
        let className = 'bg-gray-500';
        switch (type) {
            case 'ph':
                if (value < 6.0 || value > 8.0) {
                    className = 'bg-red-500';
                } else if (value < 6.5 || value > 7.5) {
                    className = 'bg-yellow-500';
                } else {
                    className = 'bg-green-500';
                }
                break;
            case 'do':
                if (value < 4) {
                    className = 'bg-red-500';
                } else if (value < 5) {
                    className = 'bg-yellow-500';
                } else {
                    className = 'bg-green-500';
                }
                break;
            case 'nh4':
                if (value >= 0.4) {
                    className = 'bg-red-500';
                } else if (value >= 0.2) {
                    className = 'bg-yellow-500';
                } else {
                    className = 'bg-green-500';
                }
                break;
            case 'salinity':
                if (value < 5) {
                    className = 'bg-blue-500';
                } else if (value > 35) {
                    className = 'bg-red-500';
                } else if (value >= 25) {
                    className = 'bg-green-500';
                } else {
                    className = 'bg-yellow-500';
                }
                break;
            case 'temp':
                if (value < 24.0 || value >= 31.0) {
                    className = 'bg-red-500';
                } else if (value < 26.0 || value >= 29.0) {
                    className = 'bg-yellow-500';
                } else {
                    className = 'bg-green-500';
                }
                break;
            default:
                className = 'bg-gray-500';
                break;
        }
        return className;
    }

    public getGrowout(stockEpochSeconds: number, releaseEpochSeconds: number): { totalDurationMs: number; totalGrowoutDays: number; daysSinceStock: number; daysUntilRelease: number; completionPercentage: number } {
        const MS_IN_SECOND = 1000;
        const stockEpochMs = stockEpochSeconds * MS_IN_SECOND;
        const releaseEpochMs = releaseEpochSeconds * MS_IN_SECOND;
        const nowEpochMs = new Date().getTime();
        const msInDay = this.MS_IN_DAY;
        const todayMidnightEpochMs = Math.floor(nowEpochMs / msInDay) * msInDay;
        const stockMidnightEpochMs = Math.floor(stockEpochMs / msInDay) * msInDay;
        const releaseMidnightEpochMs = Math.floor(releaseEpochMs / msInDay) * msInDay;
        const totalDurationMs = releaseEpochMs - stockEpochMs;
        const totalGrowoutDays = Math.floor(totalDurationMs / msInDay);
        if (totalGrowoutDays <= 0) {
            return { totalDurationMs: 0, totalGrowoutDays: 0, daysSinceStock: 0, daysUntilRelease: 0, completionPercentage: 0 };
        }
        const ageDiffMs = todayMidnightEpochMs - stockMidnightEpochMs;
        const daysSinceStock = Math.max(0, Math.floor(ageDiffMs / msInDay));
        const remainingDiffMs = releaseMidnightEpochMs - todayMidnightEpochMs;
        const daysUntilRelease = Math.max(0, Math.floor(remainingDiffMs / msInDay));
        const completionPercentage = (daysSinceStock / totalGrowoutDays) * 100;
        let growoutData = { totalDurationMs: totalDurationMs, totalGrowoutDays: totalGrowoutDays, daysSinceStock: daysSinceStock, daysUntilRelease: daysUntilRelease, completionPercentage: Math.min(100, parseFloat(completionPercentage.toFixed(1))) };
        return growoutData;
    }

    public safeGetEpochMs(dateObject: any) {
        if (dateObject) {
            if (typeof dateObject.toDate === 'function') {
                const date = dateObject.toDate();
                if (!isNaN(date.getTime())) {
                    return date.getTime();
                }
            } else if (typeof dateObject === 'object' && dateObject !== null && typeof dateObject.seconds === 'number') {
                return dateObject.seconds * 1000;
            } else if (dateObject instanceof Date && !isNaN(dateObject.getTime())) {
                return dateObject.getTime();
            }
        }
        return null;
    }

    public goToTankDetails(zoneName: string, tankId: string): void {
        const pathSegments = ['tankdetails', zoneName.toLowerCase(), tankId.toLowerCase()];

        console.log(`Navigating to: /${pathSegments.join('/')}`);

        // ✅ CORRECT: Use the Angular Router's navigate method
        this.router.navigate(pathSegments);

        // ❌ REMOVE THIS LINE: window.location.hash = url;
    }

    public goToTankConfig(zoneName: string, tankId: string): void {
        const pathSegments = ['tankconfig', zoneName.toLowerCase(), tankId.toLowerCase()];
        localStorage.setItem('configTarget', tankId);
        localStorage.setItem('configTargetZone', zoneName);
        console.log('configTarget', tankId);

        // ✅ CORRECT: Use the Angular Router's navigate method
        this.router.navigate(pathSegments);
    }

    public setControlTarget(zoneName: string, tankId: string) {
        localStorage.setItem('configTarget', tankId);
        localStorage.setItem('configTargetZone', zoneName);
        this.router.navigate(['tankcontrol']);
    }
}
