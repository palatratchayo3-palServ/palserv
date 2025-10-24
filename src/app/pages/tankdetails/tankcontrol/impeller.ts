import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

// This component uses a simple SVG structure for an impeller (a hub and three blades).
// The spinning animation is achieved purely through CSS keyframes defined in the 'styles' array.
@Component({
    selector: 'app-impeller',
    standalone: true,
    template: `
        <div class="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
            <h1 class="text-3xl font-extrabold text-blue-400 mb-8 tracking-wider">Impeller Animation</h1>

            <div class="p-8 bg-gray-800 rounded-xl shadow-2xl transition-all duration-300 hover:shadow-blue-500/50 max-w-sm w-full">
                <div class="text-center mb-6 text-gray-300">
                    <p class="font-semibold">Simulated Flow Rate</p>
                    <p class="text-xs text-blue-400">RPM: {{ rpm() }}</p>
                </div>

                <!-- Impeller Container -->
                <div class="flex justify-center items-center">
                    <svg viewBox="0 0 100 100" class="impeller-svg w-48 h-48" xmlns="http://www.w3.org/2000/svg">
                        <!-- Background Ring (Visual Depth) -->
                        <circle cx="50" cy="50" r="48" fill="none" stroke="#374151" stroke-width="2" />

                        <!-- The Spinning Group (applies animation) -->
                        <g class="spinning-blades">
                            <!-- Central Hub -->
                            <circle cx="50" cy="50" r="15" fill="#1D4ED8" stroke="#3B82F6" stroke-width="2">
                                <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="4s" repeatCount="indefinite" />
                            </circle>

                            <!-- Blade 1 (Simplified curved path for impeller look) -->
                            <path d="M 50 50 L 50 20 C 60 10, 80 10, 80 30 L 70 40 L 50 50 Z" fill="#60A5FA" />

                            <!-- Blade 2 (Rotated 120 degrees) -->
                            <path d="M 50 50 L 50 20 C 60 10, 80 10, 80 30 L 70 40 L 50 50 Z" fill="#60A5FA" transform="rotate(120 50 50)" />

                            <!-- Blade 3 (Rotated 240 degrees) -->
                            <path d="M 50 50 L 50 20 C 60 10, 80 10, 80 30 L 70 40 L 50 50 Z" fill="#60A5FA" transform="rotate(240 50 50)" />
                        </g>
                    </svg>
                </div>

                <button
                    (click)="toggleSpin()"
                    class="mt-8 w-full py-3 px-4 rounded-lg font-semibold shadow-lg transition-all duration-200
                 text-white"
                    [class.bg-green-600]="!isSpinning()"
                    [class.hover:bg-green-700]="!isSpinning()"
                    [class.bg-red-600]="isSpinning()"
                    [class.hover:bg-red-700]="isSpinning()"
                >
                    {{ isSpinning() ? 'Stop Impeller' : 'Start Impeller' }}
                </button>
            </div>
        </div>
    `,
    styles: [
        `
            /* Keyframes for continuous rotation */
            @keyframes spin {
                from {
                    transform: rotate(0deg);
                }
                to {
                    transform: rotate(360deg);
                }
            }

            /* Apply the animation to the spinning-blades group */
            .spinning-blades {
                transform-origin: 50% 50%;
            }

            .impeller-svg g.spinning-blades.active {
                animation: spin 1.5s linear infinite; /* 1.5s duration, continuous, linear speed */
            }

            /* Ensure the button text is readable on mobile */
            @media (max-width: 640px) {
                .text-3xl {
                    font-size: 2rem;
                }
            }
        `
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImpellerSpinning {
    // Signals for state management
    isSpinning = signal(true);
    rpm = signal(400); // Revolutions Per Minute

    constructor() {
        // Set the initial state based on the signal
        // We need to wait for the view to initialize to grab the element
        setTimeout(() => {
            this.updateAnimationClass();
        }, 0);
    }

    // Updates the CSS class to start/stop the animation
    updateAnimationClass() {
        const spinningGroup = document.querySelector('.spinning-blades');
        if (spinningGroup) {
            if (this.isSpinning()) {
                spinningGroup.classList.add('active');
            } else {
                spinningGroup.classList.remove('active');
            }
        }
    }

    // Toggles the spinning state
    toggleSpin() {
        this.isSpinning.update((value) => !value);
        this.rpm.update((value) => (value === 400 ? 0 : 400));
        this.updateAnimationClass();
    }
}
