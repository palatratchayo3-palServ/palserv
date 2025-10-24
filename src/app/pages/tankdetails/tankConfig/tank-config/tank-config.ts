import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { CommonModule, TitleCasePipe } from '@angular/common';

// PrimeNG Imports (REMOVED due to environment error, but components remain in template)
// NOTE: You must re-add the necessary PrimeNG modules (e.g., InputTextModule, CardModule, etc.)
// to the 'imports' array in your working Angular environment for this code to run.
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
// import { CalendarModule } from 'primeng/calendar';
// import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { NewpalfireServices } from '@/palservices/newpalfire';
import { SelectModule } from 'primeng/select';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

// Interface definition for strong typing
interface TankConfigs {
    id: string;
    lastconfig: {
        configby: string;
        date: number; // epoch
    };
    stock: {
        hatcheryName: string;
        product: string;
        qty: number;
        stockDate: number; // epoch
        stockingPeriod: number;
        targetweight: number;
        weightGram: number;
    };
    tankParam: {
        ph: { min: number; max: number };
        dox: { min: number; max: number };
        nh4: { min: number; max: number };
        turbidity: { min: number; max: number };
        salinity: { min: number; max: number };
        waterlevel: { min: number; max: number };
        temp_c: { min: number; max: number };
    };
    tanktype: 'growout' | 'nursery';
    zone: string;
}

@Component({
    selector: 'app-tankconfig',
    standalone: true,
    // Using Angular 17+ built-in control flow (@for, @if)
    imports: [
        CommonModule,
        ReactiveFormsModule,
        CardModule,
        DividerModule,
        DatePickerModule,
        MessageModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        ReactiveFormsModule,
        InputTextModule,
        InputNumberModule,
        DatePickerModule,
        SelectModule,
        ButtonModule,
        InputGroupModule,
        InputGroupAddonModule
        // PrimeNG modules need to be imported here in your actual project:
        // InputTextModule, InputNumberModule, CalendarModule, DropdownModule, ButtonModule, CardModule, DividerModule, MessageModule
    ],
    templateUrl: './tank-config.html',
    styleUrls: ['./tank-config.scss']
})
export class TankConfig implements OnInit {
    tankConfigForm!: FormGroup;
    configTarget: any;
    preConfigData: any;
    tankTypes = ['growout', 'nursery'];
    parameterKeys = ['ph', 'dox', 'nh4', 'turbidity', 'salinity', 'waterlevel', 'temp_c'];

    tankTypeOptions = [
        { label: 'Growout', value: 'growout' },
        { label: 'Nursery', value: 'nursery' }
    ];

    constructor(private fb: FormBuilder) {}
    private fireStore = inject(NewpalfireServices);
    //
    ngOnInit() {
        this.configTarget = localStorage.getItem('configTarget');
        this.tankConfigForm = this.fb.group({
            lastconfig: this.fb.group({
                configby: this.fb.control('', Validators.required),
                date: this.fb.control(Date.now(), Validators.required)
            }),
            stock: this.fb.group({
                hatcheryName: this.fb.control('', Validators.required),
                product: this.fb.control('', Validators.required),
                qty: this.fb.control(1000, Validators.required),
                stockDate: this.fb.control(Date.now(), Validators.required),
                stockingPeriod: this.fb.control(60),
                targetweight: this.fb.control(500),
                weightGram: this.fb.control(10)
            }),
            tankParam: this.fb.group({
                ph: this.fb.group({ min: this.fb.control(6.5), max: this.fb.control(8.0) }),
                dox: this.fb.group({ min: this.fb.control(5), max: this.fb.control(9) }),
                nh4: this.fb.group({ min: this.fb.control(0), max: this.fb.control(0.05) }),
                turbidity: this.fb.group({ min: this.fb.control(0), max: this.fb.control(20) }),
                salinity: this.fb.group({ min: this.fb.control(0), max: this.fb.control(10) }),
                waterlevel: this.fb.group({ min: this.fb.control(50), max: this.fb.control(100) }),
                temp_c: this.fb.group({ min: this.fb.control(25), max: this.fb.control(32) })
            }),
            tanktype: this.fb.control<'growout' | 'nursery'>('growout'),
            zone: this.fb.control('', Validators.required)
        });
        this.getTankConfig();
        this.tankConfigForm.setValue(this.preConfigData);
    }

    getTankConfig() {
        this.fireStore.getItemsById('tank_config', this.configTarget).subscribe((data) => {
            console.log('Preconf :', data);
            this.preConfigData = data;
        });
    }

    onSubmit() {
        const config = this.tankConfigForm.getRawValue() as TankConfigs;
        console.log('✅ Form Data:', config);
    }
}
