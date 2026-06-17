import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
    AbstractControl,
    NonNullableFormBuilder,
    ReactiveFormsModule,
    ValidationErrors,
    Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';

import { SubscriptionPlanStore } from '../../../application/subscription-plan.store';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

@Component({
    selector: 'app-organization-registration',
    imports: [
        ReactiveFormsModule,
        TranslatePipe,
        CurrencyPipe,
        NgIcon,
        LanguageSwitcher
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

    protected passwordVisible = signal(false);
    protected confirmPasswordVisible = signal(false);

    protected selectedPlan = computed(() =>
        this.plans().find(plan => plan.code === this.selectedPlanCode()) ?? null
    );

    protected form = this.formBuilder.group({
        organizationName: ['', [Validators.required]],
        ruc: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
        address: ['', [Validators.required]],
        organizationPhone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],

        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
    }, {
        validators: this.passwordsMatchValidator
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
                phone: this.formatPeruPhone(this.form.controls.organizationPhone.value)
            },
            administrator: {
                firstName: this.form.controls.firstName.value,
                lastName: this.form.controls.lastName.value,
                email: this.form.controls.email.value,
                password: this.form.controls.password.value,
                phone: this.formatPeruPhone(this.form.controls.phone.value)
            }
        }).subscribe(response => {
            if (!response?.checkoutUrl) return;

            window.location.href = response.checkoutUrl;
        });
    }

    protected goToSignIn(): void {
        this.router.navigate(['/sign-in']);
    }

    protected togglePasswordVisibility(): void {
        this.passwordVisible.update(value => !value);
    }

    protected toggleConfirmPasswordVisibility(): void {
        this.confirmPasswordVisible.update(value => !value);
    }

    protected normalizePhoneInput(controlName: 'organizationPhone' | 'phone'): void {
        const control = this.form.controls[controlName];
        const digits = control.value.replace(/\D/g, '').slice(0, 9);

        if (control.value !== digits) {
            control.setValue(digits, { emitEvent: false });
        }
    }

    protected normalizeRucInput(): void {
        const control = this.form.controls.ruc;
        const digits = control.value.replace(/\D/g, '').slice(0, 11);

        if (control.value !== digits) {
            control.setValue(digits, { emitEvent: false });
        }
    }

    protected passwordsDoNotMatch(): boolean {
        const password = this.form.controls.password.value;
        const confirmPassword = this.form.controls.confirmPassword.value;

        return this.form.controls.confirmPassword.touched &&
            password.length > 0 &&
            confirmPassword.length > 0 &&
            password !== confirmPassword;
    }

    private loadPlans(): void {
        this.subscriptionPlanStore.clearMessages();

        this.subscriptionPlanStore.loadPlans().subscribe(() => {
            if (!this.selectedPlan()) {
                this.subscriptionPlanStore.setErrorMessage('subscription.registration.error.plan-not-found');
            }
        });
    }

    private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.get('password')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;

        if (!password || !confirmPassword) return null;

        return password === confirmPassword ? null : { passwordsMismatch: true };
    }

    private formatPeruPhone(value: string): string {
        const digits = value.replace(/\D/g, '').slice(0, 9);

        return `+51 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
    }
}