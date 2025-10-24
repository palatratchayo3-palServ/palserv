import { DataCacheService } from './app/palservices/realtimeservice/realtime_subscriber.service';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {
    private dataCacheService = inject(DataCacheService);

    ngOnInit(): void {
        console.log('App starting: Initializing Data Cache...');

        // 2. Call the method to start the subscriptions and populate localStorage
        this.dataCacheService.initializeCache();
    }
}
