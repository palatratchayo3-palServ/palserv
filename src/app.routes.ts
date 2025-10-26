import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Notfound } from './app/pages/notfound/notfound';
import { Tankdetails } from './app/pages/tankdetails/tankdetails/tankdetails';
import { Tankhistory } from './app/pages/tankdetails/tankhistory/tankhistory/tankhistory';
import { TankConfig } from './app//pages/tankdetails/tankConfig/tank-config/tank-config';
import { Tankcontrol } from './app/pages/tankdetails/tankcontrol/tankcontrol';
import { SolarDashboard } from './app/pages/dashboard/components/solarsystem//solardashboard/solardashboard';
import { ForecastComponent } from '@/pages/forecast_reports/forecast/forecast';
import { F1dashboard } from '@/formula1/f1dashboard/f1dashboard';
import { Weather } from '@/weather/weather';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard },
            { path: 'tankdetails/:zoneid/:tankid', component: Tankdetails },
            { path: 'tankhistory', component: Tankhistory },
            { path: 'tankconfig/:zoneid/:tankid', component: TankConfig },
            { path: 'tankcontrol', component: Tankcontrol },
            { path: 'solardashboard', component: SolarDashboard },
            { path: 'forecast', component: ForecastComponent },
            { path: 'f1dashboard', component: F1dashboard },
            { path: 'weather', component: Weather }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' }
];
