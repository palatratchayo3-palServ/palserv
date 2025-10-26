import { Component, OnInit, signal, computed, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
// --- OPENF1 API INTERFACE ---

interface WeatherReading {
    date: string; // Timestamp
    air_temperature: number;
    humidity: number;
    pressure: number;
    rainfall: boolean;
    session_key: number;
    track_temperature: number;
    wind_direction: number;
    wind_speed: number;
    meeting_key: number;
}

// --- INTERFACES AND MOCK DATA ---

interface SessionTime {
    date: string; // YYYY-MM-DD
    time: string; // HH:MM:SSZ (UTC Time)
}

interface Location {
    lat: string;
    long: string;
    locality: string;
    country: string;
}

interface Circuit {
    circuitName: string;
    Location: Location;
}

// Interface for a specific session detail (internal use)
interface SessionDetail {
    name: string;
    date: Date;
    isNext: boolean;
    isFinished: boolean;
}

interface RaceEvent {
    season: string;
    round: string;
    raceName: string;
    Circuit: Circuit;
    date: string; // Main Race Date
    time: string; // Main Race Time
    circuitId?: string;
    url?: string;
    FirstPractice?: SessionTime;
    SecondPractice?: SessionTime;
    ThirdPractice?: SessionTime;
    Qualifying?: SessionTime;
    Sprint?: SessionTime;
    SprintQualifying?: SessionTime;

    trackLengthKm?: number;
    raceLaps?: number;

    CircuitLayoutUrls: string;
    meetingKey: number; // Key required for schedule logic (but now we use 'latest' for weather API)
}

/** * Full 2025 F1 Schedule (Simulated Dates).
 * The current date is simulated as 2025-10-24, making the Mexico City GP the next event.
 * Meeting keys are mock data based on typical API sequential keys.
 * @type {RaceEvent[]}
 */
const MOCK_SCHEDULE: RaceEvent[] = [
    // ... (PAST RACES - shortened for brevity)
    {
        season: '2025',
        round: '1',
        raceName: 'Bahrain Grand Prix',
        circuitId: 'bahrain',
        Circuit: { circuitName: 'Bahrain International Circuit', Location: { lat: '26.0325', long: '50.5106', locality: 'Sakhir', country: 'Bahrain' } },
        date: '2025-03-02',
        time: '15:00:00Z',
        CircuitLayoutUrls: '',
        trackLengthKm: 5.412,
        raceLaps: 57,
        meetingKey: 1201
    },
    // ... (17 more past races)

    // 19. UPCOMING RACE (Simulated next event)
    {
        season: '2025',
        round: '19',
        raceName: 'Mexico City Grand Prix',
        circuitId: 'autodromo_hermanos_rodriguez',
        Circuit: { circuitName: 'Autódromo Hermanos Rodríguez', Location: { lat: '19.4042', long: '-99.0917', locality: 'Mexico City', country: 'Mexico' } },
        date: '2025-10-26',
        time: '20:00:00Z',
        FirstPractice: { date: '2025-10-24', time: '18:30:00Z' }, // Next Session (Current time 09:39 UTC)
        SecondPractice: { date: '2025-10-24', time: '22:00:00Z' },
        ThirdPractice: { date: '2025-10-25', time: '18:00:00Z' },
        Qualifying: { date: '2025-10-25', time: '21:30:00Z' },
        // Updated to use a mock URL that simulates the asset path (you would replace this with a real path to your hosted image)
        CircuitLayoutUrls: 'https://www.sportmonks.com/wp-content/uploads/2022/07/Auto%CC%81dromo-Hermanos-Rodri%CC%81guez--768x432.png',
        trackLengthKm: 4.304,
        raceLaps: 71,
        meetingKey: 1219 // Mock Meeting Key for API
    },

    // 20-24 (FUTURE RACES)
    {
        season: '2025',
        round: '20',
        raceName: 'Brazilian Grand Prix (Sprint)',
        circuitId: 'interlagos',
        Circuit: { circuitName: 'Autódromo José Carlos Pace', Location: { lat: '-23.7036', long: '-46.6997', locality: 'São Paulo', country: 'Brazil' } },
        date: '2025-11-09',
        time: '18:00:00Z',
        // Updated to use a mock URL that simulates the asset path (you would replace this with a real path to your hosted image)
        CircuitLayoutUrls: 'https://www.sportmonks.com/wp-content/uploads/2022/07/Auto%CC%81dromo-Jose%CC%81-Carlos-Pace--768x432.png',
        trackLengthKm: 4.309,
        raceLaps: 71,
        meetingKey: 1220
    },
    {
        season: '2025',
        round: '21',
        raceName: 'Las Vegas Grand Prix',
        circuitId: 'vegas',
        Circuit: { circuitName: 'Las Vegas Strip Circuit', Location: { lat: '36.1147', long: '-115.172', locality: 'Las Vegas', country: 'USA' } },
        date: '2025-11-23',
        time: '06:00:00Z',
        CircuitLayoutUrls: 'https://www.sportmonks.com/wp-content/uploads/2024/02/Las-Vegas-GP-768x432.png',
        trackLengthKm: 6.201,
        raceLaps: 50,
        meetingKey: 1221
    }
];

const OPENF1_BASE_URL = 'https://api.openf1.org/v1/';
const MAX_RETRIES = 5;

// --- UTILITY FUNCTIONS ---

/**
 * Calculates the time remaining until a target date.
 */
function getTimeRemaining(targetDate: Date): { display: string; finished: boolean; days: number; hours: number; minutes: number; seconds: number } {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    // 5 minutes grace period after start to determine if a session is truly over
    if (difference <= -5 * 60 * 1000) {
        return { display: 'FINISHED', finished: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    if (difference <= 0) {
        return { display: 'LIVE', finished: false, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    if (minutes > 0 || (days === 0 && hours === 0)) parts.push(`${minutes}m`);

    // Show seconds if less than 1 hour remaining or less than 5 minutes for better real-time feel
    if (days === 0 && hours < 1) {
        parts.push(`${seconds}s`);
    } else if (days === 0 && hours > 0 && minutes < 5) {
        parts.push(`${seconds}s`);
    }

    return { display: parts.join(' '), finished: false, days, hours, minutes, seconds };
}

// --- ANGULAR COMPONENT ---

@Component({
    selector: 'app-f1upcoming',
    standalone: true,
    imports: [CommonModule, DatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="p-4 sm:p-6 md:p-8 flex flex-col items-center w-full min-h-screen bg-gray-50 font-sans">
            <h1 class="text-3xl font-extrabold text-gray-900 mb-6 border-b-4 border-red-600 pb-2">F1 Grand Prix Weekend Tracker</h1>

            @if (upcomingRace(); as race) {
                @if (nextSession(); as next) {
                    <!-- NEW UNIFIED CARD CONTAINER -->
                    <div id="unified-race-card" class="w-full max-w-4xl bg-white shadow-2xl rounded-xl overflow-hidden border-4 border-red-600/70 mb-8">
                        <!-- 1. HEADER & COUNTDOWN SECTION (Dark for impact) -->
                        <div class="p-6 md:p-8 bg-gray-900 text-white">
                            <!-- Main Header Row: Title + Progress Bar/Countdown -->
                            <div class="flex flex-col relative z-20 mb-4">
                                <!-- CRITICAL FIX: Changed main alignment from items-baseline to items-center for better overall vertical centering -->
                                <div class="flex flex-col sm:flex-row items-end sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                                    <!-- Left Side: Session & Race Name (Combined) -->
                                    <div class="flex flex-col sm:flex-row items-start sm:items-center space-x-2 flex-shrink min-w-0">
                                        <!-- FIX: New inner div to align the icon and the pill perfectly -->
                                        <div class="flex items-center space-x-1 flex-shrink-0 mb-1 sm:mb-0">
                                            <!-- Icon -->
                                            <i class="pi pi-caret-right text-red-600" style="font-size: 2rem"></i>
                                            <!-- Session Name (FP1) - STYLED AS RED PILL -->
                                            <h4 class="bg-red-600 text-gray-100 px-2 py-1 rounded-lg text-sm sm:text-base uppercase font-bold tracking-widest leading-none">
                                                {{ next.name }}
                                            </h4>
                                        </div>

                                        <!-- Race Name (Mexico City Grand Prix) -->
                                        <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight text-red-400 drop-shadow-lg truncate w-full sm:w-auto">
                                            {{ race.raceName }}
                                        </h2>
                                    </div>

                                    <!-- Right Side: Countdown/Progress Block -->
                                    <div class="flex flex-col items-start sm:items-end w-full sm:w-auto min-w-[150px] flex-grow sm:flex-grow-0">
                                        <!-- Countdown Display Text -->
                                        <p class="text-sm sm:text-lg font-black text-red-400 leading-tight mb-1">
                                            {{ countdown().display }}
                                        </p>

                                        <!-- Custom Progress Bar (Simulating PrimeNG) -->
                                        <!-- Use duration-500 for smoother visual progress updates -->
                                        <div class="w-full h-2.5 bg-gray-700 rounded-full overflow-hidden shadow-inner border border-gray-600">
                                            <div class="h-full bg-red-600 transition-all duration-500 ease-linear" [style.width.%]="progressPercentage()"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- END Main Header Row -->

                            <!-- Middle Row: Circuit Map + Weather + Schedule (3-COLUMN GRID on MD+) -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-20 pt-4 border-t-2 border-white/10 mt-4">
                                <!-- 1. Circuit Layout & Details (1/3 column) -->
                                <div class="flex flex-col items-center justify-center p-3 bg-gray-800 rounded-xl shadow-lg">
                                    <h5 class="text-sm uppercase font-bold text-red-400 mb-2">Circuit Overview</h5>

                                    <!-- Circuit Map (Smaller Image: max-w-24) -->
                                    <img
                                        [src]="race.CircuitLayoutUrls"
                                        alt="{{ race.Circuit.circuitName }} circuit layout map"
                                        class="w-full max-w-24 h-auto object-contain rounded-md shadow-md mb-3 border-2 border-gray-700"
                                        onerror="this.onerror=null;this.src='https://placehold.co/96x52/0A0A0A/E50000?text=NO%20MAP';"
                                    />

                                    <!-- Track Details -->
                                    <div class="text-xs w-full space-y-1">
                                        <div class="flex justify-between items-center py-1 border-b border-gray-700">
                                            <span class="font-semibold text-gray-400">Track Length (KM):</span>
                                            <span class="font-bold text-white">{{ race.trackLengthKm ? (race.trackLengthKm | number: '1.3-3') : 'TBD' }}</span>
                                        </div>
                                        <div class="flex justify-between items-center py-1">
                                            <span class="font-semibold text-gray-400">Race Laps:</span>
                                            <span class="font-bold text-white">{{ race.raceLaps || 'TBD' }}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- 2. Weather Data Section (1/3 column) -->
                                <div class="flex flex-col justify-between p-3 bg-gray-800 rounded-xl shadow-lg">
                                    <h5 class="text-sm uppercase font-bold text-red-400 mb-2">Current Weather (OpenF1)</h5>
                                    @if (latestWeather(); as weather) {
                                        <div class="grid grid-cols-2 gap-2 text-xs w-full">
                                            <div class="flex flex-col p-2 bg-gray-700/50 rounded-lg">
                                                <span class="text-gray-400">Air Temp</span>
                                                <span class="text-lg font-bold text-white">{{ weather.air_temperature | number: '1.0-1' }}°C</span>
                                            </div>
                                            <div class="flex flex-col p-2 bg-gray-700/50 rounded-lg">
                                                <span class="text-gray-400">Track Temp</span>
                                                <span class="text-lg font-bold text-white">{{ weather.track_temperature | number: '1.0-1' }}°C</span>
                                            </div>
                                            <div class="flex flex-col p-2 bg-gray-700/50 rounded-lg">
                                                <span class="text-gray-400">Humidity</span>
                                                <span class="text-lg font-bold text-white">{{ weather.humidity | number: '1.0-0' }}%</span>
                                            </div>
                                            <div class="flex flex-col p-2 bg-gray-700/50 rounded-lg">
                                                <span class="text-gray-400">Wind</span>
                                                <span class="text-lg font-bold text-white"> {{ weather.wind_speed | number: '1.0-0' }} km/h </span>
                                            </div>
                                        </div>
                                        <p class="text-xs text-gray-500 mt-2 text-right">Last update: {{ weather.date | date: 'shortTime' }}</p>
                                    } @else {
                                        <div class="text-center p-3">
                                            <p class="text-gray-400 text-sm">Fetching weather data...</p>
                                            <p class="text-gray-500 text-xs mt-1">Requires live session or recent data.</p>
                                        </div>
                                    }
                                </div>

                                <!-- 3. Weekend Schedule List (1/3 column - Clean Scrollbar) -->
                                <div class="p-3 bg-gray-800 rounded-xl shadow-lg">
                                    <h5 class="text-sm uppercase font-bold text-red-400 mb-2 border-b border-gray-700 pb-1">Weekend Schedule</h5>
                                    @if (processedSessions().length > 0) {
                                        <!-- Applied max-h and custom scrollbar class -->
                                        <div class="space-y-1 max-h-[12rem] overflow-y-auto hide-scrollbar">
                                            @for (session of processedSessions(); track session.name) {
                                                <!-- Compact, two-line layout for narrow column -->
                                                <div class="flex flex-col py-1 border-b border-gray-700 text-xs" [class]="getSessionClasses(session.isNext, session.isFinished)">
                                                    <!-- Name and Status -->
                                                    <div class="flex justify-between items-center mb-0.5">
                                                        <div class="font-medium text-gray-200 truncate">{{ session.name }}</div>
                                                        <div class="text-[9px] uppercase font-mono py-0.5 px-1 rounded-full ml-1 flex-shrink-0" [class]="getStatusClasses(session.isNext, session.isFinished)">
                                                            @if (session.isNext) {
                                                                NEXT
                                                            } @else {
                                                                {{ getRemainingStatus(session.date) }}
                                                            }
                                                        </div>
                                                    </div>

                                                    <!-- Date and Time -->
                                                    <div class="text-gray-400">
                                                        {{ session.date | date: 'EEE, h:mm a z' }}
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    } @else {
                                        <p class="text-gray-500 italic text-xs">No detailed schedule.</p>
                                    }
                                </div>
                                <!-- END OF SCHEDULE LIST SECTION -->
                            </div>

                            <!-- Bottom Row: Date & Time Info (Localised) -->
                            <div class="text-white relative z-20 pt-4 border-t-2 border-white/10 mt-4">
                                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end">
                                    <!-- Location Info -->
                                    <div class="flex items-center space-x-3 mb-2 sm:mb-0">
                                        <span class="text-2xl drop-shadow">📍</span>
                                        <div>
                                            <!-- RESPONSIVENESS TWEAK: Adjusted font size for small screens -->
                                            <p class="text-base sm:text-lg font-semibold">{{ race.Circuit.Location.locality }}</p>
                                            <p class="text-sm text-gray-300">{{ race.Circuit.Location.country }}</p>
                                        </div>
                                    </div>

                                    <!-- Date & Time Info (Localised) -->
                                    <div class="text-sm sm:text-base text-right">
                                        <p class="font-semibold">Starts: {{ next.date | date: 'EEEE, MMM d' }}</p>
                                        <p class="text-gray-400">Time: {{ next.date | date: 'h:mm a z' }} (Local)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 2. OLD SCHEDULE SECTION REMOVED -->
                    </div>
                    <!-- END OF UNIFIED CARD -->
                }

                <!-- Loading/Error State (Kept outside the main card logic) -->
                <div class="mt-6 p-6 w-full max-w-4xl bg-white shadow-xl rounded-xl border border-gray-200 text-center">
                    @if (isLoading()) {
                        <div class="flex items-center justify-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-red-600"></div>
                            <p class="ml-3 text-gray-700 font-medium">Initializing Calendar...</p>
                        </div>
                    } @else if (!upcomingRace()) {
                        <h3 class="font-bold text-xl mb-2 text-red-800">No Upcoming Race</h3>
                        <p class="text-gray-600">The 2025 F1 season appears to be complete or the schedule data is missing.</p>
                    }
                </div>
            } @else {
                <!-- Initial loading state outside the main card block -->
                <div class="mt-6 p-6 w-full max-w-4xl bg-white shadow-xl rounded-xl border border-gray-200 text-center">
                    <div class="flex items-center justify-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-red-600"></div>
                        <p class="ml-3 text-gray-700 font-medium">Initializing Calendar...</p>
                    </div>
                </div>
            }
        </div>
    `,
    styles: [
        `
            /* Custom styles for the F1 theme */
            :host {
                display: block;
                font-family: 'Inter', sans-serif;
            }

            @keyframes spin {
                from {
                    transform: rotate(0deg);
                }
                to {
                    transform: rotate(360deg);
                }
            }
            .animate-spin {
                animation: spin 1s linear infinite;
            }

            /* --- CRITICAL FIX: AGGRESSIVELY HIDE SCROLLBAR --- */

            /* Hide scrollbar for Chrome, Safari and Opera (Webkit) */
            .hide-scrollbar::-webkit-scrollbar {
                display: none;
                width: 0;
                height: 0;
            }

            /* Hide scrollbar for IE and Edge */
            .hide-scrollbar {
                -ms-overflow-style: none;
            }

            /* Hide scrollbar for Firefox */
            .hide-scrollbar {
                scrollbar-width: none;
            }
            /* ------------------------------------------------ */
        `
    ]
})
export class F1Upcoming implements OnInit, OnDestroy {
    // State Signals
    public upcomingRace = signal<RaceEvent | null>(null);
    public nextSession = signal<SessionDetail | null>(null);
    public weatherData = signal<WeatherReading[]>([]);
    public isLoading = signal(true);

    private countdownInterval: any;
    private weatherFetchInterval: any;

    // Define the animation window duration (Now 24 hours in milliseconds)
    private readonly ANIMATION_WINDOW_MS = 24 * 60 * 60 * 1000;

    /**
     * Computed signal for the countdown timer.
     */
    public countdown = computed(() => {
        const next = this.nextSession();
        if (!next) {
            return { display: 'TBD', finished: false, days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        return getTimeRemaining(next.date);
    });

    /**
     * Computed signal for the countdown percentage.
     * The bar fills up from 0% to 100% in the final 24 hours before the session starts.
     */
    public progressPercentage = computed(() => {
        const next = this.nextSession();
        if (!next) return 0;

        const now = new Date().getTime();
        const targetTime = next.date.getTime();
        const difference = targetTime - now; // Time remaining in ms

        // 1. Session is finished or live
        if (difference <= 0) {
            return 100; // Show 100% when LIVE/FINISHED (Event is here)
        }

        // 2. Event is outside the animation window (more than 24 hours away)
        if (difference > this.ANIMATION_WINDOW_MS) {
            return 0; // Show 0%
        }

        // 3. Event is inside the animation window (less than 24 hours away)
        // Time elapsed in the window = ANIMATION_WINDOW_MS - difference
        const timeElapsedInWindow = this.ANIMATION_WINDOW_MS - difference;

        // Percentage = (Time Elapsed / Total Window Duration) * 100
        const percentage = (timeElapsedInWindow / this.ANIMATION_WINDOW_MS) * 100;

        // Ensure the percentage is between 0 and 100
        return Math.min(100, Math.max(0, percentage));
    });

    /**
     * Computed signal to get the latest weather reading.
     */
    public latestWeather = computed(() => {
        const data = this.weatherData();
        // The API returns data chronologically, so the last element is the latest.
        return data.length > 0 ? data[data.length - 1] : null;
    });

    /**
     * Generic fetch function for OpenF1 API with exponential backoff.
     */
    private async fetchOpenF1(endpoint: string, params: Record<string, any>, retries = 0): Promise<any> {
        const urlParams = new URLSearchParams(params as Record<string, string>);
        const url = `${OPENF1_BASE_URL}${endpoint}?${urlParams.toString()}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 429 && retries < MAX_RETRIES) {
                    const delay = Math.pow(2, retries) * 1000;
                    console.warn(`[OpenF1] Rate limit hit. Retrying in ${delay / 1000}s...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    return this.fetchOpenF1(endpoint, params, retries + 1);
                }
                throw new Error(`[OpenF1] HTTP error! Status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`[OpenF1] Failed to fetch data from ${endpoint}:`, error);
            // Re-throw the error or return a structure that indicates failure
            return [];
        }
    }

    /**
     * Fetches weather data for the current meeting using 'latest'.
     */
    private async fetchWeatherData(): Promise<void> {
        // Fetch weather data for the latest meeting/session
        const weatherData = await this.fetchOpenF1('weather', {
            // Using meetingKey: 'latest' as requested for real-time data
            meeting_key: 'latest'
        });

        if (Array.isArray(weatherData)) {
            // Filter out invalid readings and ensure chronological order before setting the state.
            // This order is crucial for the 'latestWeather' computed signal to work correctly.
            const validWeather = (weatherData as WeatherReading[]).filter((w) => w.track_temperature !== null && w.air_temperature !== null).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            this.weatherData.set(validWeather);
        } else {
            this.weatherData.set([]);
        }
    }

    ngOnInit(): void {
        this.getUpcomingRace();

        // Start the countdown timer. We only need to trigger a signal update
        // to re-run the 'countdown' and 'progressPercentage' computed signals every second.
        this.countdownInterval = setInterval(() => {
            this.nextSession.update((val) => val);
        }, 1000);

        // Start weather polling (e.g., every 60 seconds)
        // We call fetchWeatherData() without arguments, which uses 'latest' internally.
        this.weatherFetchInterval = setInterval(() => {
            this.fetchWeatherData();
        }, 60000);
    }

    ngOnDestroy() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        if (this.weatherFetchInterval) {
            clearInterval(this.weatherFetchInterval);
        }
    }

    /**
     * Finds the next upcoming race weekend and the next session within that weekend.
     */
    getUpcomingRace(): void {
        this.isLoading.set(true);
        const now = new Date();

        // 1. Find the next race weekend
        const upcomingRace = MOCK_SCHEDULE.find((race) => {
            const raceDateUTC = new Date(`${race.date}T${race.time}`);
            // Check if the race is within 5 days of starting or is in the future
            return raceDateUTC.getTime() > now.getTime() - 5 * 24 * 60 * 60 * 1000;
        });

        if (!upcomingRace) {
            this.upcomingRace.set(null);
            this.nextSession.set(null);
            this.isLoading.set(false);
            return;
        }

        this.upcomingRace.set(upcomingRace);

        // --- Fetch Weather Data Immediately: Using 'latest' as requested ---
        this.fetchWeatherData();
        // -----------------------------------------------------------

        const allSessions = this.processedSessions();

        // 2. Find the absolute next session (closest one in the future)
        const nextUpcomingSession = allSessions
            .filter((s) => s.date.getTime() > now.getTime() - 5 * 60 * 1000) // 5 min grace period
            .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

        if (nextUpcomingSession) {
            this.nextSession.set({
                ...nextUpcomingSession,
                isNext: true,
                isFinished: false
            });
        } else {
            // All sessions are finished for this race weekend
            this.nextSession.set({
                name: 'Race Finished',
                date: new Date(`${upcomingRace.date}T${upcomingRace.time}`),
                isNext: false,
                isFinished: true
            });
        }

        this.isLoading.set(false);
    }

    /**
     * Generates a URL for the circuit layout image based on the race object's CircuitLayoutUrls.
     */
    // getCircuitImageUrl(race: RaceEvent): string {
    //     let url: string = '';
    //     if (race) {
    //         url = '/assets/f1_circuits/' + race.Circuit.circuitName + '.png';
    //         console.log(url);
    //     } else {
    //         url = 'https://placehold.co/96x52/0A0A0A/E50000?text=NO%20MAP';
    //     }
    //     return url;
    // }

    public processedSessions = computed<SessionDetail[]>(() => {
        const race = this.upcomingRace();
        const next = this.nextSession();
        if (!race) return [];

        const sessionMap: { [key in keyof RaceEvent]?: string } = {
            FirstPractice: 'FP1',
            SecondPractice: 'FP2',
            ThirdPractice: 'FP3',
            Qualifying: 'Qualifying',
            SprintQualifying: 'SQ',
            Sprint: 'Sprint Race'
        };

        const sessions: SessionDetail[] = [];
        sessions.push({
            name: race.raceName.replace(' Grand Prix', '') + ' (Race)',
            date: new Date(`${race.date}T${race.time}`),
            isNext: false,
            isFinished: false
        });

        for (const key in sessionMap) {
            if (race.hasOwnProperty(key) && (race as any)[key]) {
                const session = (race as any)[key] as SessionTime;
                sessions.push({
                    name: sessionMap[key as keyof RaceEvent]!,
                    date: new Date(`${session.date}T${session.time}`),
                    isNext: false,
                    isFinished: false
                });
            }
        }

        const sortedSessions = sessions.sort((a, b) => a.date.getTime() - b.date.getTime());

        return sortedSessions.map((session) => {
            const remaining = getTimeRemaining(session.date);
            return {
                ...session,
                isNext: next ? session.name === next.name : false,
                isFinished: remaining.finished || remaining.display === 'LIVE'
            };
        });
    });

    getRemainingStatus(date: Date): string {
        const status = getTimeRemaining(date).display;
        if (status === 'LIVE' || status === 'FINISHED') return status;
        return 'UPCOMING';
    }

    getSessionClasses(isNext: boolean, isFinished: boolean): string {
        // Classes adjusted for the dark background and compact space
        if (isNext) {
            return 'bg-red-900/40 text-red-400 font-semibold border-l-2 border-red-600';
        }
        if (isFinished) {
            return 'text-gray-400 opacity-70';
        }
        return 'hover:bg-gray-700/50 text-gray-200 border-l-2 border-transparent';
    }

    getStatusClasses(isNext: boolean, isFinished: boolean): string {
        if (isNext) {
            return 'bg-red-600 text-white font-bold';
        }
        if (isFinished) {
            return 'bg-green-600 text-white';
        }
        return 'bg-blue-600 text-white';
    }
}
