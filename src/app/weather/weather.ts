import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs';
import { tmdToken } from 'src/environments';
// ⚠️ IMPORTANT: Replace this with your actual TMD API access token
const Token = tmdToken;

// 🚨 MOCK INTERFACE: Once you inspect the JSON data, you MUST replace 'any'
// with the correct TypeScript interfaces. For example, if the data is an array
// of forecast entries:
// interface ForecastEntry { tc: number; rh: number; ... }
// type TMDResponseData = ForecastEntry[];

@Component({
    standalone: true,
    selector: 'app-weather',
    imports: [CommonModule],
    templateUrl: './weather.html',
    styleUrls: ['./weather.scss']
})
export class Weather implements OnInit {
    // Configuration details
    public Token = tmdToken;
    public tmdEndpoint = 'https://data.tmd.go.th/nwpapi/v1/forecast/location/hourly/at';

    // Default parameters
    lat = '14.023872';
    lon = '99.722707';
    duration = '1'; // Set a default duration (e.g., 48 hours)
    requestedFields = 'tc,rh,rain,ws10m,wd10m,cond,cloudlow,cloudmed,cloudhigh';

    // 💡 FIX: Added '!' (Non-Null Assertion Operator) to resolve TS2564 error
    public weatherData!: Promise<any>;

    ngOnInit(): void {
        this.weatherData = this.getForecastData();
    }

    /**
     * Fetches hourly forecast data from the TMD API.
     * @param latitude The latitude for the forecast location.
     * @param longitude The longitude for the forecast location.
     * @param duration The forecast duration in hours (e.g., '48').
     * @param fields The desired forecast variables, comma-separated (e.g., 'tc,rh,ws').
     * @returns A promise that resolves to the raw, unknown JSON response data.
     */
    private async fetchTmdForecast(latitude: string, longitude: string, duration: string, fields: string): Promise<any> {
        // 1. Build the Query Parameters
        const params = new URLSearchParams({
            lat: latitude,
            lon: longitude,
            duration: duration,
            fields: fields
        });

        const url = `${this.tmdEndpoint}?${params.toString()}`;

        // 2. Define Request Options, including the Authorization Header
        const requestOptions: RequestInit = {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${this.Token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        };

        try {
            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                const errorDetail = await response.text();
                throw new Error(`TMD API request failed! Status: ${response.status}. Detail: ${errorDetail.substring(0, 100)}...`);
            }

            const data: any = await response.json();

            // Log the data here to inspect its structure and define your interfaces!
            console.log('--- TMD Raw Data for Inspection ---', data);

            return data;
        } catch (error) {
            console.error('Error fetching TMD forecast:', error);
            // Re-throw the error so the promise is rejected
            throw error;
        }
    }

    /**
     * Executes the fetch function and sets the weatherData promise.
     */
    public getForecastData(): Promise<any> {
        return this.fetchTmdForecast(this.lat, this.lon, this.duration, this.requestedFields);
    }
}
