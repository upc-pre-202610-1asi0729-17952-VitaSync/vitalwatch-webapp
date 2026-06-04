import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BillingPeriod, Plan } from '../domain/model/plan.entity';
import { Subscription, SubscriptionStatus } from '../domain/model/subscription.entity';
import { CheckoutSession, CheckoutSessionStatus } from '../domain/model/checkout-session.entity';
import { UpdateSubscriptionPlanRequest } from './update-subscription-plan-request';
import {
  CheckoutSessionStatusResponse,
  CreateOrganizationCheckoutRequest,
  CreateOrganizationCheckoutResponse
} from './create-organization-checkout-request';
interface PlanResource {
  id: number;
  code: string;
  name: string;
  price: number;
  billingPeriod: BillingPeriod;
  description: string;
  currency?: string;
  descriptionKey?: string;
  maxDoctors?: number | null;
  maxSupervisors?: number | null;
  maxTeams?: number | null;
  maxWorkAreas?: number | null;
  monthlyInvitations?: number | null;
  dataHistoryDays?: number;
  supportLevel?: string;
  recommended?: boolean;
  featureKeys?: string[];
  enabledModules?: string[];
  disabledModules?: string[];
}

interface SubscriptionResource {
  id: number;
  organizationId: number;
  planId: number;
  status: SubscriptionStatus;
  startedAt: string;
}

interface CheckoutSessionResource {
  id: number;
  organizationId: number;
  administratorId: number;
  subscriptionId: number;
  planId: number;
  planCode: string;
  status: CheckoutSessionStatus;
  createdAt: string;
}

interface OrganizationResource {
  id: number;
  name: string;
  ruc: string;
  address: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  planId: number;
}

interface UserResource {
  id: number;
  organizationId: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
  role: 'HOSPITAL_ADMIN' | 'SUPERVISOR' | 'DOCTOR';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

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
  private createOrganizationCheckoutSessionUrl =`${environment.platformProviderApiBaseUrl}/billing/create-checkout-session`;
  private checkoutSessionStatusUrl = `${environment.platformProviderApiBaseUrl}/billing/checkout-session-status`;
  
  
  
  createOrganizationCheckoutSession(
    request: CreateOrganizationCheckoutRequest
    ): Observable<CreateOrganizationCheckoutResponse> {
    return this.http.post<CreateOrganizationCheckoutResponse>(
    this.createOrganizationCheckoutSessionUrl,
    request
    );}

getCheckoutSessionStatus(
  stripeSessionId: string
): Observable<CheckoutSessionStatusResponse> {
  return this.http.get<CheckoutSessionStatusResponse>(
    `${this.checkoutSessionStatusUrl}?session_id=${encodeURIComponent(stripeSessionId)}`
  );
}
  
  
  getPlans(): Observable<Plan[]> {


    return this.http
      .get<PlanResource[]>(this.plansUrl)
      .pipe(
        map(resources => resources.map(resource => this.toPlan(resource)))
      );

      
  }

  getSubscriptionByOrganizationId(organizationId: number): Observable<Subscription | null> {
    return this.http
      .get<SubscriptionResource[]>(`${this.subscriptionsUrl}?organizationId=${organizationId}`)
      .pipe(
        map(resources => resources.length > 0 ? this.toSubscription(resources[0]) : null)
      );
  }

  getCheckoutSessionsByOrganizationId(organizationId: number): Observable<CheckoutSession[]> {
    return this.http
      .get<CheckoutSessionResource[]>(
        `${this.checkoutSessionsUrl}?organizationId=${organizationId}&_sort=createdAt&_order=desc`
      )
      .pipe(
        map(resources => resources.map(resource => this.toCheckoutSession(resource)))
      );
  }

  updateSubscriptionPlan(
    subscriptionId: number,
    request: UpdateSubscriptionPlanRequest
  ): Observable<Subscription> {
    return this.http
      .patch<SubscriptionResource>(`${this.subscriptionsUrl}/${subscriptionId}`, request)
      .pipe(
        map(resource => this.toSubscription(resource))
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
      .post<CheckoutSessionResource>(this.checkoutSessionsUrl, payload)
      .pipe(
        switchMap(session =>
          this.updateSubscriptionPlan(request.subscriptionId, { planId: request.planId }).pipe(
            map(() => this.toCheckoutSession(session))
          )
        )
      );
  }

  createOrganization(request: CreateOrganizationRequest): Observable<OrganizationResource> {
    const payload = {
      ...request,
      status: 'ACTIVE'
    };

    return this.http.post<OrganizationResource>(this.organizationsUrl, payload);
  }

  createHospitalAdministrator(request: CreateHospitalAdministratorRequest): Observable<UserResource> {
    const payload = {
      ...request,
      role: 'HOSPITAL_ADMIN',
      status: 'ACTIVE'
    };

    return this.http.post<UserResource>(this.usersUrl, payload);
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
      .post<SubscriptionResource>(this.subscriptionsUrl, payload)
      .pipe(
        map(resource => this.toSubscription(resource))
      );
  }

  registerOrganizationWithAdministrator(request: {
    plan: Plan;
    organization: CreateOrganizationRequest;
    administrator: Omit<CreateHospitalAdministratorRequest, 'organizationId'>;
  }): Observable<{
    organization: OrganizationResource;
    administrator: UserResource;
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

  private toPlan(resource: PlanResource): Plan {
    return new Plan({
      id: resource.id,
      code: resource.code,
      name: resource.name,
      price: resource.price,
      currency: resource.currency,
      billingPeriod: resource.billingPeriod,
      description: resource.description,
      descriptionKey: resource.descriptionKey,
      maxDoctors: resource.maxDoctors,
      maxSupervisors: resource.maxSupervisors,
      maxTeams: resource.maxTeams,
      maxWorkAreas: resource.maxWorkAreas,
      monthlyInvitations: resource.monthlyInvitations,
      dataHistoryDays: resource.dataHistoryDays,
      supportLevel: resource.supportLevel,
      recommended: resource.recommended,
      featureKeys: resource.featureKeys,
      enabledModules: resource.enabledModules,
      disabledModules: resource.disabledModules
    });
  }

  private toSubscription(resource: SubscriptionResource): Subscription {
    return new Subscription({
      id: resource.id,
      organizationId: resource.organizationId,
      planId: resource.planId,
      status: resource.status,
      startedAt: resource.startedAt
    });
  }

  private toCheckoutSession(resource: CheckoutSessionResource): CheckoutSession {
    return new CheckoutSession({
      id: resource.id,
      organizationId: resource.organizationId,
      administratorId: resource.administratorId,
      subscriptionId: resource.subscriptionId,
      planId: resource.planId,
      planCode: resource.planCode,
      status: resource.status,
      createdAt: resource.createdAt
    });
  }
}