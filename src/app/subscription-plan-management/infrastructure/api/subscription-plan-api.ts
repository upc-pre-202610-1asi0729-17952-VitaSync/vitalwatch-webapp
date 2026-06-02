import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class SubscriptionPlanApi {
  private http = inject(HttpClient);

  private plansUrl = `${environment.platformProviderApiBaseUrl}${environment.plansEndpointPath}`;
  private subscriptionsUrl = `${environment.platformProviderApiBaseUrl}${environment.subscriptionsEndpointPath}`;
  private checkoutSessionsUrl = `${environment.platformProviderApiBaseUrl}${environment.checkoutSessionsEndpointPath}`;
  private organizationsUrl = `${environment.platformProviderApiBaseUrl}${environment.organizationsEndpointPath}`;
  private usersUrl = `${environment.platformProviderApiBaseUrl}${environment.usersEndpointPath}`;

  getPlans(): Observable<Plan[]> {
    return this.http
      .get<PlanResponse[]>(this.plansUrl)
      .pipe(
        map(responses => PlanAssembler.toEntities(responses))
      );
  }

  getSubscriptionByOrganizationId(organizationId: number): Observable<Subscription | null> {
    return this.http
      .get<SubscriptionResponse[]>(`${this.subscriptionsUrl}?organizationId=${organizationId}`)
      .pipe(
        map(responses =>
          responses.length > 0
            ? SubscriptionAssembler.toEntity(responses[0])
            : null
        )
      );
  }

  getCheckoutSessionsByOrganizationId(organizationId: number): Observable<CheckoutSession[]> {
    return this.http
      .get<CheckoutSessionResponse[]>(
        `${this.checkoutSessionsUrl}?organizationId=${organizationId}&_sort=createdAt&_order=desc`
      )
      .pipe(
        map(responses => CheckoutSessionAssembler.toEntities(responses))
      );
  }

  updateSubscriptionPlan(
    subscriptionId: number,
    request: UpdateSubscriptionPlanRequest
  ): Observable<Subscription> {
    return this.http
      .patch<SubscriptionResponse>(`${this.subscriptionsUrl}/${subscriptionId}`, request)
      .pipe(
        map(response => SubscriptionAssembler.toEntity(response))
      );
  }

  createCompletedCheckoutSession(request: {
    organizationId: number;
    administratorId: number;
    subscriptionId: number;
    planId: number;
    planCode: string;
  }): Observable<CheckoutSession> {
    const payload = {
      ...request,
      status: 'COMPLETED' as CheckoutSessionStatus,
      createdAt: new Date().toISOString()
    };

    return this.http
      .post<CheckoutSessionResponse>(this.checkoutSessionsUrl, payload)
      .pipe(
        switchMap(session =>
          this.updateSubscriptionPlan(request.subscriptionId, { planId: request.planId }).pipe(
            map(() => CheckoutSessionAssembler.toEntity(session))
          )
        )
      );
  }

  createOrganization(request: CreateOrganizationRequest): Observable<OrganizationResponse> {
    const payload = {
      ...request,
      status: 'ACTIVE'
    };

    return this.http.post<OrganizationResponse>(this.organizationsUrl, payload);
  }

  createHospitalAdministrator(request: CreateHospitalAdministratorRequest): Observable<UserResponse> {
    const payload = {
      ...request,
      role: 'HOSPITAL_ADMIN',
      status: 'ACTIVE'
    };

    return this.http.post<UserResponse>(this.usersUrl, payload);
  }

  createSubscription(request: {
    organizationId: number;
    planId: number;
  }): Observable<Subscription> {
    const payload = {
      ...request,
      status: 'ACTIVE' as SubscriptionStatus,
      startedAt: new Date().toISOString()
    };

    return this.http
      .post<SubscriptionResponse>(this.subscriptionsUrl, payload)
      .pipe(
        map(response => SubscriptionAssembler.toEntity(response))
      );
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
      switchMap(organization =>
        this.createHospitalAdministrator({
          ...request.administrator,
          organizationId: organization.id
        }).pipe(
          switchMap(administrator =>
            this.createSubscription({
              organizationId: organization.id,
              planId: request.plan.id
            }).pipe(
              switchMap(subscription =>
                this.createCompletedCheckoutSession({
                  organizationId: organization.id,
                  administratorId: administrator.id,
                  subscriptionId: subscription.id,
                  planId: request.plan.id,
                  planCode: request.plan.code
                }).pipe(
                  map(checkoutSession => ({
                    organization,
                    administrator,
                    subscription,
                    checkoutSession
                  }))
                )
              )
            )
          )
        )
      )
    );
  }
}