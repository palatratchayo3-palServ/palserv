import { Injectable } from '@angular/core';
import { addDoc, collection, collectionData, doc, docData, Firestore } from '@angular/fire/firestore';
import { deleteDoc, updateDoc, DocumentData, DocumentReference, query, QueryConstraint } from 'firebase/firestore';
import { Observable } from 'rxjs';

// The base Item interface is no longer needed in this file, but we'll leave it
// as a placeholder to show the generic implementation.

@Injectable({
    providedIn: 'root'
})
export class NewpalfireServices {
    constructor(private fireStore: Firestore) {}

    // 1. Generic Create Method (T is the type of the document being created)
    async createItem<T>(col: string, data: T): Promise<DocumentReference<DocumentData>> {
        const itemCollection = collection(this.fireStore, col);
        // The 'data' object is enforced to be of type T
        return await addDoc(itemCollection, data as DocumentData);
    }

    // 2. Generic Get All Method (Returns an Observable of T[])
    getItems<T>(col: string): Observable<T[]> {
        const itemCollection = collection(this.fireStore, col);
        // Returns an array of T objects
        return collectionData(itemCollection, { idField: 'id' }) as Observable<T[]>;
    }

    // 3. Generic Get By ID Method (Returns an Observable of T)
    getItemsById<T>(col: string, id: string): Observable<T> {
        const itemDoc = doc(this.fireStore, col, id);
        // Returns a single T object
        return docData(itemDoc, { idField: 'id' }) as Observable<T>;
    }

    // 4. Generic Update Method (data is Partial<T> for partial updates)
    async updateItems<T>(col: string, id: string, data: Partial<T>): Promise<void> {
        const itemDoc = doc(this.fireStore, col, id);
        // The 'data' object must partially match type T
        await updateDoc(itemDoc, data);
    }

    // 5. Delete Method (Doesn't need generics, as it handles a standard action)
    async deleteItems(col: string, id: string): Promise<void> {
        const itemDoc = doc(this.fireStore, col, id);
        await deleteDoc(itemDoc);
    }

    //6.
    queryItems<T>(col: string, constraints: QueryConstraint[] = []): Observable<T[]> {
        const itemCollection = collection(this.fireStore, col);

        // Apply the constraints if they exist, otherwise just use the collection reference.
        const firestoreQuery = query(itemCollection, ...constraints);

        // Use the query to fetch the data
        return collectionData(firestoreQuery, { idField: 'id' }) as Observable<T[]>;
    }
}
