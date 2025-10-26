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

export const tmdToken: string =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjU4ZjNlYWE2ZDJhNjUwZTJiNWIwNmUzYTY5Y2U3ZGI2Mjk1NzdlNmJjOWMxNTE0ZTM5NDcwOWQ4YThiZjQ2YzNmYzhhODE4MTQ5NTQzYmZmIn0.eyJhdWQiOiIyIiwianRpIjoiNThmM2VhYTZkMmE2NTBlMmI1YjA2ZTNhNjljZTdkYjYyOTU3N2U2YmM5YzE1MTRlMzk0NzA5ZDhhOGJmNDZjM2ZjOGE4MTgxNDk1NDNiZmYiLCJpYXQiOjE3NjEzOTM1NjUsIm5iZiI6MTc2MTM5MzU2NSwiZXhwIjoxNzkyOTI5NTY1LCJzdWIiOiI0NTc0Iiwic2NvcGVzIjpbXX0.cG19O6qDvxC82-Vr0bafCmKJUYhHI5weHA54YipRa2LDuskiPhUsQy2aIVf1SUn9nSiEDMSktG_LerGaJj2H95LiBkchWMQc2oPaJ5edsazgk-lYrLTDmiN2lj4WcMdMtoZhF1b7yVArJL4c9lbkAx12XIplU4wfiCSAFJiTTFl-JhawN9Tnux3Bto_zkxdJw7cxbtyUyBgkUovYE-EXOMqr7CDwfu8eeJVSWWVH0URWmyMpnjoHVDUHdGQ2ejSEuohO_2ThWDxyLjp41o4rnLNL7QuRCNmVU4orraXFCAUYDn1DSl6G9VxiS_OkhyWUiaUjSlCb2d63uX378D9AqgOk_Z-0599ftHG0OtMv9RkR-tHtHNExWvcQI1xsufrk14yc40Im1-0yMomnfHbvJN8_1sLhgYTk0FjaYl5k6fdk4-9b4UI5csTURRFXNRA6y8ThqM0aaQK4nM7uvbBFBdUYRs8acH4_WDMe8fX5IQ3fLg-qIBcs5VjZXU0RWh1UtlZGF8-H_jezxvUPZqdGreS1rqYMnlVCMCvxTFGuHZolYXOTR98RKN8exdSXEMqaklkQabvERvcwX0V0UO0W7Xg9d78nc2FvNqpL_6CndCgaTvE23I_XAfhr4kfgbo--IJnHeYE66ZyeClz19BLCnZiJEq5s10XBd_e5bF6MfoA';
