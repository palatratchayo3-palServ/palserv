declare const __app_id: string;

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs'; // Import BehaviorSubject
import { getFirestore, collection, query, onSnapshot, Firestore, addDoc } from 'firebase/firestore';

// --- DataService: Centralized Firestore Subscription and Caching Handler ---

@Injectable({ providedIn: 'root' })
export class FarmdashDataService {
    private db: Firestore;
    private appId: string;

    // Use a BehaviorSubject for each zone to hold the current data and emit immediately
    // The public observable will be derived from the subject
    private zoneASubject = new BehaviorSubject<any[]>(this.loadFromLocalStorage('zone_A') || []);
    private zoneBSubject = new BehaviorSubject<any[]>(this.loadFromLocalStorage('zone_B') || []);
    private zoneCSubject = new BehaviorSubject<any[]>(this.loadFromLocalStorage('zone_C') || []);
    private zoneDSubject = new BehaviorSubject<any[]>(this.loadFromLocalStorage('zone_D') || []);

    // Public observables exposing the BehaviorSubject's value stream
    public zoneA$: Observable<any[]> = this.zoneASubject.asObservable();
    public zoneB$: Observable<any[]> = this.zoneBSubject.asObservable();
    public zoneC$: Observable<any[]> = this.zoneCSubject.asObservable();
    public zoneD$: Observable<any[]> = this.zoneDSubject.asObservable();

    constructor() {
        this.appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        this.db = getFirestore();

        // 2. Define and start the real-time observables, centralizing the Firestore logic
        // This will now pipe data through the BehaviorSubject
        this.startRealTimeSubscription('zone_A', this.zoneASubject);
        this.startRealTimeSubscription('zone_B', this.zoneBSubject);
        this.startRealTimeSubscription('zone_C', this.zoneCSubject);
        this.startRealTimeSubscription('zone_D', this.zoneDSubject);
    }

    // --- Private Caching Handlers ---

    private getLocalStorageKey(collectionName: string): string {
        // Unique key: e.g., 'farmdash-cache-zone_A'
        return `farmdash-cache-${collectionName}`;
    }

    private saveToLocalStorage(collectionName: string, data: any[]): void {
        const key = this.getLocalStorageKey(collectionName);
        try {
            // Local storage only accepts strings
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Could not save data to local storage for ${collectionName}`, e);
        }
    }

    private loadFromLocalStorage(collectionName: string): any[] | null {
        const key = this.getLocalStorageKey(collectionName);
        const serializedData = localStorage.getItem(key);
        if (serializedData) {
            try {
                // Parse the string back into a JavaScript object (array)
                return JSON.parse(serializedData);
            } catch (e) {
                console.error(`Could not parse data from local storage for ${collectionName}`, e);
                localStorage.removeItem(key); // Clear bad data
            }
        }
        return null;
    }

    // --- Real-time Subscription (Modified) ---

    /**
     * Creates and manages a real-time subscription for a collection, updating the provided BehaviorSubject and cache.
     */
    private startRealTimeSubscription<T>(collectionName: string, subject: BehaviorSubject<T[]>): void {
        if (!this.db) {
            console.error('Firestore not initialized.');
            return;
        }

        const path = `artifacts/${this.appId}/public/data/${collectionName}`;
        const collectionRef = collection(this.db, path);
        const q = query(collectionRef);

        // onSnapshot sets up the real-time listener and returns the unsubscribe function
        onSnapshot(
            q,
            (snapshot) => {
                const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);

                // 1. Update the BehaviorSubject (Reactivity)
                subject.next(data);

                // 2. Save to Local Storage (Persistence)
                this.saveToLocalStorage(collectionName, data);

                console.debug(`Data updated for ${collectionName}. Docs count: ${data.length}`);
            },
            (error) => {
                console.error(`Firestore subscription error for ${collectionName}:`, error);
                // Propagate the error through the Subject
                subject.error(error);
            }
        );
        // Note: The unsubscribe is implicitly managed by Angular's DI lifecycle or can be captured
        // and manually called in ngOnDestroy if this service was not providedIn: 'root'.
    }

    // --- addData (Unchanged) ---
    async addData(zone: 'zone_A' | 'zone_B' | 'zone_C' | 'zone_D') {
        const path = `artifacts/${this.appId}/public/data/${zone}`;
        const collectionRef = collection(this.db, path);

        const newData: any = {
            name: `${zone} Item #${Math.floor(Math.random() * 1000)}`,
            timestamp: Date.now()
        };

        try {
            await addDoc(collectionRef, newData);
            console.log(`Added data to ${zone}`);
        } catch (error) {
            console.error(`Error adding document to ${zone}:`, error);
        }
    }
}
