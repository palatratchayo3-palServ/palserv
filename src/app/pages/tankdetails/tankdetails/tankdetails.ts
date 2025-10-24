import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, JsonPipe, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs'; // Added for cleanup

// 📌 MOCK SERVICE PATH: Adjust this path to your actual service location
import { DataCacheService } from '../../../palservices/realtimeservice/realtime_subscriber.service';
import { Tankhistory } from '../tankhistory/tankhistory/tankhistory';

// import { Tankhistory } from '../tankhistory/tankhistory';
// Define the interface for the tank object to ensure strong typing
export interface FirestoreDoc {
    id: string; // Document ID (usually same as Firestore doc ID)
    currentStock: string;
    date_epoch: number;
    do: number; // Dissolved Oxygen
    nh4: number; // Ammonia
    ph: number;
    releaseDate: number;
    salinity: number;
    stockDate: number;
    tankId: string; // This will match the corrected URL parameter (e.g., 'A1')
    temp_c: number; // Temperature in Celsius
    timestamp: number;
    turbidity: number;
    waterlevel: number;
}

// Define the interface for the tank object to ensure strong typing
export interface FirestoreDoc {
    id: string; // Document ID (usually same as Firestore doc ID)
    currentStock: string;
    date_epoch: number;
    do: number; // Dissolved Oxygen
    nh4: number; // Ammonia
    ph: number;
    releaseDate: number;
    salinity: number;
    stockDate: number;
    tankId: string; // This will match the corrected URL parameter (e.g., 'A1')
    temp_c: number; // Temperature in Celsius
    timestamp: number;
    turbidity: number;
    waterlevel: number;
}

// Interface for the cached data structure, expected to be { [zoneId: string]: FirestoreDoc[] }
interface ZoneData {
    [key: string]: FirestoreDoc[];
}

@Component({
    selector: 'app-tankdetails',
    standalone: true,
    imports: [CommonModule, JsonPipe, DatePipe, Tankhistory],
    templateUrl: './tankdetails.html', // 🎯 UPDATED: Linked to external HTML file
    styles: [
        `
            :host {
                display: block;
                font-family: 'Inter', sans-serif;
                background-color: #f3f4f6;
                min-height: 100vh;
            }
        `
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Tankdetails implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private cdRef = inject(ChangeDetectorRef);
    private dataCacheService = inject(DataCacheService);

    // Properties for real-time update handling
    private currentCacheDataString: string | null = null;
    private internalUpdateSubscription!: Subscription;
    private storageEventListener: (event: StorageEvent) => void;

    // Data properties
    zoneId: string = '';
    tankId: string = '';
    selectedTank: FirestoreDoc | undefined;

    constructor() {
        this.storageEventListener = this.handleStorageChange.bind(this);
    }

    ngOnInit() {
        // 1. Set up listeners first
        this._setupRealtimeListeners();

        // 2. Subscribe to route parameters (initial load and URL changes)
        this.route.paramMap.subscribe((params) => {
            const urlZoneId = params.get('zoneid');
            const urlTankId = params.get('tankid');

            if (urlZoneId && urlTankId) {
                // 1. Correct URL parameters to DB key format
                this._correctUrlParameters(urlZoneId, urlTankId);

                // 2. Load and set the tank object from the service cache
                this._setSelectedTankFromCache();
            } else {
                console.error('Missing required route parameters (zoneid or tankid).');
            }
        });
    }

    // --- Real-time Subscription Setup ---
    private _setupRealtimeListeners(): void {
        // 1. Listen for external updates (other tabs)
        window.addEventListener('storage', this.storageEventListener);

        // 2. Listen for internal updates (same tab service updates)
        this.internalUpdateSubscription = (this.dataCacheService as any)['cacheUpdated$'].subscribe(() => {
            this.handleInternalUpdate();
        });
    }

    // --- Same-Tab Update Handler (via RxJS Subject) ---
    private handleInternalUpdate(): void {
        this._setSelectedTankFromCache();
        this.currentCacheDataString = localStorage.getItem('app_data_cache');
        this.cdRef.detectChanges();
        console.log('Tankdetails re-rendered due to SAME-TAB service update.');
    }

    // --- Cross-Tab Update Handler (via Storage Event) ---
    private handleStorageChange(event: StorageEvent): void {
        if (event.key === 'app_data_cache') {
            const newCacheDataString = localStorage.getItem('app_data_cache');

            if (newCacheDataString !== this.currentCacheDataString) {
                this.currentCacheDataString = newCacheDataString;
                this._setSelectedTankFromCache();
                this.cdRef.detectChanges();
                console.log('Tankdetails re-rendered due to EXTERNAL storage update.');
            }
        }
    }

    // --- Data Selection Logic (Adapted for Service) ---
    private _setSelectedTankFromCache(): void {
        // 1. Get the entire zone data object
        // 🎯 FIX: Use 'as unknown as ZoneData' to perform a double assertion.
        // This is necessary because the DataCache type likely doesn't have a
        // structural overlap (missing index signature) with ZoneData.
        const allZoneData: ZoneData = (this.dataCacheService.getCachedData() as unknown as ZoneData) || {};

        // 2. Check if the specific zone array exists
        const zoneTankArray: FirestoreDoc[] = allZoneData[this.zoneId] || [];

        // 3. Find the tank object using the corrected tankId
        const foundTank = zoneTankArray.find((doc) => doc.tankId === this.tankId);

        // 4. Update component state
        this.selectedTank = foundTank;
    }

    private _correctUrlParameters(rawZoneId: string, rawTankId: string): void {
        // Tank ID Correction: All uppercase (e.g., 'a1' -> 'A1')
        this.tankId = rawTankId.toUpperCase();

        // Zone ID Correction: Capitalize the last character (e.g., 'zone_a' -> 'zone_A')
        if (rawZoneId.length > 0) {
            const prefix = rawZoneId.slice(0, -1);
            const lastChar = rawZoneId.slice(-1).toUpperCase();
            this.zoneId = prefix + lastChar;
        } else {
            this.zoneId = rawZoneId;
        }
    }

    // --- Cleanup ---
    ngOnDestroy(): void {
        window.removeEventListener('storage', this.storageEventListener);
        if (this.internalUpdateSubscription) {
            this.internalUpdateSubscription.unsubscribe();
        }
    }
}
