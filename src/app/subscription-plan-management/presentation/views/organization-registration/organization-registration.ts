import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { SubscriptionPlanStore } from '../../../application/subscription-plan.store';

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
    private subscriptionPlanStore = inject(SubscriptionPlanStore);

    protected selectedPlanCode = signal<string>('professional');

    protected plans = this.subscriptionPlanStore.plans;
    protected loading = this.subscriptionPlanStore.loading;
    protected errorMessage = this.subscriptionPlanStore.error;
    protected successMessage = this.subscriptionPlanStore.successMessage;

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
            this.subscriptionPlanStore.setErrorMessage('subscription.registration.error.plan-not-found');
            return;
        }

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.subscriptionPlanStore.setErrorMessage('subscription.registration.error.create-failed');
            return;
        }

        this.subscriptionPlanStore.createOrganizationCheckoutSession({
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
        }).subscribe(response => {
            if (!response?.checkoutUrl) return;

            window.location.href = response.checkoutUrl;
        });
    }

    protected goToSignIn(): void {
        this.router.navigate(['/sign-in']);
    }

    private loadPlans(): void {
        this.subscriptionPlanStore.clearMessages();

        this.subscriptionPlanStore.loadPlans().subscribe(() => {
            if (!this.selectedPlan()) {
                this.subscriptionPlanStore.setErrorMessage('subscription.registration.error.plan-not-found');
            }
        });
    }
}