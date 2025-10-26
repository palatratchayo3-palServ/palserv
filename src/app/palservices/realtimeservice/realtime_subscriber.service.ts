import { inject, Injectable, OnDestroy } from '@angular/core';
import { FirestoreService, FirestoreDoc } from '../palfire.service';
// 💡 FIX 1: Import Subject
import { Observable, combineLatest, map, Subscription, Subject } from 'rxjs';

// Define the collections we want to subscribe to
const COLLECTION_NAMES = ['zone_A', 'zone_B', 'zone_C', 'zone_D'];

// Interface for the data object to be stored locally
export interface DataCache {
    zone_A: FirestoreDoc[];
    zone_B: FirestoreDoc[];
    zone_C: FirestoreDoc[];
    zone_D: FirestoreDoc[];
}

@Injectable({
    providedIn: 'root'
})
export class DataCacheService implements OnDestroy {
    // 💡 FIX 2: Declare the public Subject
    // This is the stream the component subscribes to for same-tab updates
    public cacheUpdated$ = new Subject<void>();

    // [x: string]: any; // Removed this unnecessary index signature from the class body

    private firestoreService: FirestoreService = inject(FirestoreService);
    private collectionSubscription: Subscription | null = null;
    private storageKey = 'app_data_cache';

    /**
     * 1. Initiates subscriptions to all defined collections.
     * 2. Uses combineLatest to react as soon as all collections emit their first value,
     * and again every time any collection updates.
     * 3. Writes the structured result to localStorage.
     */
    public initializeCache(): void {
        if (this.collectionSubscription) {
            console.warn('Data cache already initialized and subscribing.');
            return;
        }

        const collectionObservables: { [key: string]: Observable<FirestoreDoc[]> } = {};

        // 1. Create an Observable for each collection
        for (const name of COLLECTION_NAMES) {
            collectionObservables[name] = this.firestoreService.getCollection<FirestoreDoc>(name);
        }

        // Convert the map of observables to an array and get the keys for mapping
        const observablesArray = Object.values(collectionObservables);
        const keys = Object.keys(collectionObservables);

        // 2. Combine all Observables into one stream using combineLatest
        this.collectionSubscription = combineLatest(observablesArray)
            .pipe(
                // Map the array result back into the desired DataCache object structure
                map((dataArray: FirestoreDoc[][]): DataCache => {
                    const data: any = {};
                    for (let i = 0; i < keys.length; i++) {
                        data[keys[i]] = dataArray[i];
                    }
                    return data as DataCache;
                })
            )
            .subscribe({
                next: (data: DataCache) => {
                    // This block executes when new data arrives from Firestore
                    this.writeToLocalStorage(data);
                    // console.log('✅ Local Data Cache updated successfully.');
                },
                error: (err) => {
                    console.error('Error subscribing to collections:', err);
                }
            });
    }

    /**
     * Reads the entire cached data object from localStorage.
     * @returns The DataCache object or null if not found.
     */
    public getCachedData(): DataCache | null {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Reads a specific zone's array of documents from localStorage.
     * @param zoneName The key (e.g., 'zone_A') to retrieve.
     * @returns An array of documents or an empty array if not found.
     */
    public getZoneData(zoneName: keyof DataCache): FirestoreDoc[] {
        const cache = this.getCachedData();
        return cache ? (cache[zoneName] as FirestoreDoc[]) || [] : [];
    }

    /**
     * Cleans up the active subscription when the service is destroyed (e.g., when the app closes).
     */
    public ngOnDestroy(): void {
        if (this.collectionSubscription) {
            this.collectionSubscription.unsubscribe();
            this.collectionSubscription = null;
            console.log('🛑 Data Cache subscription unsubscribed.');
        }
    }

    /**
     * Helper function to save data to localStorage.
     */
    private writeToLocalStorage(data: DataCache): void {
        try {
            // Write to local storage (triggers 'storage' event in other tabs)
            localStorage.setItem(this.storageKey, JSON.stringify(data));

            // 💡 FIX 3: Notify components in the same tab immediately
            this.cacheUpdated$.next();
        } catch (e) {
            console.error('Failed to write to localStorage', e);
        }
    }
}
