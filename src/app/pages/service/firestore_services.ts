import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

// Define a type for the data you are fetching
interface Item {
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class FirestoreDataService {
    private firestore: Firestore = inject(Firestore);

    constructor() {}

    // Returns an Observable of a collection from Firestore
    getCols(cols: any): Observable<Item[]> {
        const itemsCollection = collection(this.firestore, cols);
        // collectionData automatically maps the collection to an Observable
        return collectionData(itemsCollection) as Observable<Item[]>;
    }
}
