import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { Plan } from '../../../domain/model/plan.entity';
import { SubscriptionPlanApi } from '../../../infrastructure/subscription-plan-api';

@Component({
    selector: 'app-organization-registration',
    imports: [
        ReactiveFormsModule,
        TranslatePipe,
        CurrencyPipe,
        NgIcon
    ],
    templateUrl: './organization-registration.html',
    styleUrl: './organization-registration.css'
})
export class OrganizationRegistration implements OnInit {
    private formBuilder = inject(NonNullableFormBuilder);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private subscriptionPlanApi = inject(SubscriptionPlanApi);

    protected plans = signal<Plan[]>([]);
    protected selectedPlanCode = signal<string>('professional');
    protected loading = signal(false);
    protected errorMessage = signal<string | null>(null);
    protected successMessage = signal<string | null>(null);

    protected selectedPlan = computed(() =>
        this.plans().find(plan => plan.code === this.selectedPlanCode()) ?? null
    );

    protected form = this.formBuilder.group({
        organizationName: ['', [Validators.required]],
        ruc: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
        address: ['', [Validators.required]],
        organizationPhone: ['', [Validators.required]],

        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    ngOnInit(): void {
        const planCode = this.route.snapshot.paramMap.get('planCode') ?? 'professional';
        this.selectedPlanCode.set(planCode);

        this.loadPlans();
    }

    protected submit(): void {
        const plan = this.selectedPlan();

        if (!plan) {
            this.errorMessage.set('subscription.registration.error.plan-not-found');
            return;
        }

if (this.form.invalid) {
    this.form.markAllAsTouched();

    const invalidFields = Object.entries(this.form.controls)
        .filter(([_, control]) => control.invalid)
        .map(([fieldName]) => fieldName);

    console.warn('Campos inválidos:', invalidFields);

    this.errorMessage.set(
        `Completa correctamente estos campos: ${invalidFields.join(', ')}`
    );

    return;
}

        this.loading.set(true);
        this.errorMessage.set(null);
        this.successMessage.set(null);

        this.subscriptionPlanApi.createOrganizationCheckoutSession({
    planCode: plan.code,
    organization: {
        name: this.form.controls.organizationName.value,
        ruc: this.form.controls.ruc.value,
        address: this.form.controls.address.value,
        phone: this.form.controls.organizationPhone.value
    },
    administrator: {
        firstName: this.form.controls.firstName.value,
        lastName: this.form.controls.lastName.value,
        email: this.form.controls.email.value,
        password: this.form.controls.password.value,
        phone: this.form.controls.phone.value
    }
}).subscribe({
    next: response => {
        this.successMessage.set('subscription.registration.success');

        if (!response.checkoutUrl) {
            this.errorMessage.set('subscription.registration.error.create-failed');
            this.loading.set(false);
            return;
        }

        window.location.href = response.checkoutUrl;
    },
    error: error => {
        if (error.status === 409) {
            this.errorMessage.set('Ya existe un usuario registrado con este correo.');
        } else {
            this.errorMessage.set('subscription.registration.error.create-failed');
        }

        this.loading.set(false);
    }
});
    }

    protected goToSignIn(): void {
        this.router.navigate(['/sign-in']);
    }

    private loadPlans(): void {
        this.loading.set(true);

        this.subscriptionPlanApi.getPlans().subscribe({
            next: plans => {
                this.plans.set(plans);

                if (!this.selectedPlan()) {
                    this.errorMessage.set('subscription.registration.error.plan-not-found');
                }

                this.loading.set(false);
            },
            error: () => {
                this.errorMessage.set('subscription.registration.error.load-plans-failed');
                this.loading.set(false);
            }
        });
    }
}