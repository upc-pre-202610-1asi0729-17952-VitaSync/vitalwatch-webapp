import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Plan } from '../../domain/model/plan.entity';
import { Subscription, SubscriptionStatus } from '../../domain/model/subscription.entity';
import { CheckoutSession, CheckoutSessionStatus } from '../../domain/model/checkout-session.entity';
import { UpdateSubscriptionPlanRequest } from '../request/update-subscription-plan-request';
import { PlanResponse } from '../responses/plan-response';
import { SubscriptionResponse } from '../responses/subscription-response';
import { CheckoutSessionResponse } from '../responses/checkout-session-response';
import { OrganizationResponse } from '../responses/organization-response';
import { UserResponse } from '../responses/user-response';
import { PlanAssembler } from '../assemblers/plan-assembler';
import { SubscriptionAssembler } from '../assemblers/subscription-assembler';
import { CheckoutSessionAssembler } from '../assemblers/checkout-session-assembler';

export interface CreateOrganizationRequest {
  name: string;
  ruc: string;
  address: string;
  phone: string;
  planId: number;
}

export interface CreateHospitalAdministratorRequest {
  organizationId: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}

export interface CreateOrganizationCheckoutRequest {
  planCode: string;
  organization: {
    name: string;
    ruc: string;
    address: string;
    phone: string;
  };
  administrator: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  };
}

export interface CreateOrganizationCheckoutResponse {
  checkoutUrl: string;
  stripeSessionId: string;
  organizationId: number;
  administratorId: number;
  subscriptionId: number;
  checkoutSessionId: number;
}

export interface CheckoutSessionStatusResponse {
  stripeSessionId: string;
  status: string;
  paymentStatus: string;
  activated: boolean;
}

export interface CancelCheckoutSessionResponse {
  cancelled: boolean;
  checkoutSessionId: number;
}

@Injectable({
  providedIn: 'root',
})
export class SubscriptionPlanApi {
  private http = inject(HttpClient);

  private plansUrl = `${environment.platformProviderApiBaseUrl}${environment.plansEndpointPath}`;
  private subscriptionsUrl = `${environment.platformProviderApiBaseUrl}${environment.subscriptionsEndpointPath}`;
  private organizationsUrl = `${environment.platformProviderApiBaseUrl}${environment.organizationsEndpointPath}`;
  private usersUrl = `${environment.platformProviderApiBaseUrl}${environment.usersEndpointPath}`;

  private createCheckoutSessionUrl = `${environment.platformProviderApiBaseUrl}/billing/create-checkout-session`;

  private checkoutSessionStatusUrl = `${environment.platformProviderApiBaseUrl}/billing/checkout-session-status`;

  private checkoutSessionsUrl = `${environment.platformProviderApiBaseUrl}/checkoutSessions`;

  createOrganizationCheckoutSession(
    request: CreateOrganizationCheckoutRequest,
  ): Observable<CreateOrganizationCheckoutResponse> {
    return this.http.post<CreateOrganizationCheckoutResponse>(
      this.createCheckoutSessionUrl,
      request,
    );
  }

  getCheckoutSessionStatus(stripeSessionId: string): Observable<CheckoutSessionStatusResponse> {
    return this.http.get<CheckoutSessionStatusResponse>(
      `${this.checkoutSessionStatusUrl}?session_id=${encodeURIComponent(stripeSessionId)}`,
    );
  }

  cancelCheckoutSession(checkoutSessionId: number): Observable<CancelCheckoutSessionResponse> {
    console.warn(
      `Checkout cancellation is not available in the Spring Boot backend yet. Checkout session: ${checkoutSessionId}`,
    );

    return of({
      cancelled: true,
      checkoutSessionId,
    });
  }

  getPlans(): Observable<Plan[]> {
    return this.http
      .get<PlanResponse[]>(this.plansUrl)
      .pipe(map((responses) => PlanAssembler.toEntities(responses)));
  }

  getSubscriptionByOrganizationId(organizationId: number): Observable<Subscription | null> {
    return this.http
      .get<SubscriptionResponse[]>(`${this.subscriptionsUrl}/organization/${organizationId}`)
      .pipe(
        map(responses => {
          if (!responses.length) return null;

          const activeSubscriptions = responses
            .filter(response => response.status === 'ACTIVE')
            .sort((first, second) => second.id - first.id);

          const selectedSubscription =
            activeSubscriptions[0] ??
            [...responses].sort((first, second) => second.id - first.id)[0];

          return SubscriptionAssembler.toEntity(selectedSubscription);
        })
      );
  }

  getCheckoutSessionsByOrganizationId(organizationId: number): Observable<CheckoutSession[]> {
    return this.http
      .get<CheckoutSessionResponse[]>(
        `${this.checkoutSessionsUrl}?organizationId=${organizationId}`
      )
      .pipe(
        map(responses => CheckoutSessionAssembler.toEntities(responses))
      );
  }

  updateSubscriptionPlan(
    subscriptionId: number,
    request: UpdateSubscriptionPlanRequest,
  ): Observable<Subscription> {
    return this.http
      .patch<SubscriptionResponse>(`${this.subscriptionsUrl}/${subscriptionId}`, request)
      .pipe(map((response) => SubscriptionAssembler.toEntity(response)));
  }

  createCompletedCheckoutSession(request: {
    organizationId: number;
    administratorId: number;
    subscriptionId: number;
    planId: number;
    planCode: string;
  }): Observable<CheckoutSession> {
    const successUrl = `${window.location.origin}/admin/subscription`;
    const cancelUrl = `${window.location.origin}/admin/subscription`;

    const checkoutPayload = {
      organizationId: request.organizationId,
      planId: request.planId,
      planCode: request.planCode,
      successUrl,
      cancelUrl,
    };

    return this.http
      .post<CheckoutSessionResourceFromBackend>(this.createCheckoutSessionUrl, checkoutPayload)
      .pipe(
        switchMap((backendSession) =>
          this.updateSubscriptionPlan(request.subscriptionId, { planId: request.planId }).pipe(
            map(
              () =>
                new CheckoutSession({
                  id: backendSession.id,
                  organizationId: request.organizationId,
                  administratorId: request.administratorId,
                  subscriptionId: request.subscriptionId,
                  planId: request.planId,
                  planCode: request.planCode,
                  status: 'COMPLETED',
                  createdAt: new Date().toISOString(),
                }),
            ),
          ),
        ),
      );
  }

  createOrganization(request: CreateOrganizationRequest): Observable<OrganizationResponse> {
    const payload = {
      legalName: request.name,
      commercialName: request.name,
      ruc: request.ruc,
      email: '',
      phone: request.phone,
      address: request.address,
    };

    return this.http.post<OrganizationResponse>(this.organizationsUrl, payload);
  }

  createHospitalAdministrator(
    request: CreateHospitalAdministratorRequest,
  ): Observable<UserResponse> {
    const username = request.email
      .split('@')[0]
      .replace(/[^a-zA-Z0-9._-]/g, '.')
      .toLowerCase();

    const payload = {
      firstName: request.firstName,
      lastName: request.lastName,
      username,
      email: request.email,
      password: request.password,
      role: 'HOSPITAL_ADMIN',
      organizationId: request.organizationId,
      specialtyId: null,
      workAreaId: null,
    };

    return this.http.post<UserResponse>(this.usersUrl, payload);
  }

  createSubscription(request: {
    organizationId: number;
    planId: number;
  }): Observable<Subscription> {
    const payload = {
      organizationId: request.organizationId,
      planId: request.planId,
      startedAt: new Date().toISOString().split('T')[0],
    };

    return this.http
      .post<SubscriptionResponse>(this.subscriptionsUrl, payload)
      .pipe(map((response) => SubscriptionAssembler.toEntity(response)));
  }

  registerOrganizationWithAdministrator(request: {
    plan: Plan;
    organization: CreateOrganizationRequest;
    administrator: Omit<CreateHospitalAdministratorRequest, 'organizationId'>;
  }): Observable<{
    organization: OrganizationResponse;
    administrator: UserResponse;
    subscription: Subscription;
    checkoutSession: CheckoutSession;
  }> {
    return this.createOrganization(request.organization).pipe(
      switchMap((organization) =>
        this.createHospitalAdministrator({
          ...request.administrator,
          organizationId: organization.id,
        }).pipe(
          switchMap((administrator) =>
            this.createSubscription({
              organizationId: organization.id,
              planId: request.plan.id,
            }).pipe(
              switchMap((subscription) =>
                this.createCompletedCheckoutSession({
                  organizationId: organization.id,
                  administratorId: administrator.id,
                  subscriptionId: subscription.id,
                  planId: request.plan.id,
                  planCode: request.plan.code,
                }).pipe(
                  map((checkoutSession) => ({
                    organization,
                    administrator,
                    subscription,
                    checkoutSession,
                  })),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

interface CheckoutSessionResourceFromBackend {
  id: number;
  sessionId: string;
  stripeSessionId: string;
  checkoutUrl: string;
  status: string;
  organizationId: number;
  planId: number;
  planCode: string;
  planName: string;
  planPrice: number;
  currency: string;
  billingPeriod: string;
}
