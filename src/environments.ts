export const firebaseConfig = {
    firebase: {
        apiKey: 'AIzaSy...',
        authDomain: 'your-app.firebaseapp.com',
        projectId: 'your-app',
        storageBucket: 'your-app.appspot.com',
        messagingSenderId: '1234567890',
        appId: '1:1234567890:web:abcdef123456'
    },
    production: false
};

export const environment = {
    firebaseConfig: {
        apiKey: 'AIzaSy...',
        authDomain: 'your-app.firebaseapp.com',
        projectId: 'your-app',
        storageBucket: 'your-app.appspot.com',
        messagingSenderId: '1234567890',
        appId: '1:1234567890:web:abcdef123456'
    },
    production: false
};

export interface FirestoreDoc {
    id: string; // Document ID (usually same as Firestore doc ID)
    currentStock: string;
    date_epoch: number;
    do: number;
    nh4: number;
    ph: number;
    releaseDate: number;
    salinity: number;
    stockDate: number;
    tankId: string;
    temp_c: number;
    timestamp: number;
    turbidity: number;
    waterlevel: number;
}

export interface Tankconfig {
    lastconfig: {
        configby: string;
        date: number;
    };
    stock: {
        hatcheryName: string;
        product: string;
        qty: number;
        stockDate: number;
        stockingPeriod: number;
        targetweight: number;
        weightGram: number;
    };
    tankParam: {
        ph: number[];
        dox: number[];
        nh4: number[];
        turbidity: number[];
        salinity: number[];
        waterlevel: number[];
        temp_c: number[];
    };
    tanktype: string;
    zone: string;
}
