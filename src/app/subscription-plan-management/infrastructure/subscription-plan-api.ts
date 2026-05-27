import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BillingPeriod, Plan } from '../domain/model/plan.entity';
import { Subscription, SubscriptionStatus } from '../domain/model/subscription.entity';
import { CheckoutSession, CheckoutSessionStatus } from '../domain/model/checkout-session.entity';
import { UpdateSubscriptionPlanRequest } from './update-subscription-plan-request';

interface PlanResource {
  id: number;
  code: string;
  name: string;
  price: number;
  billingPeriod: BillingPeriod;
  description: string;
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

@Injectable({
  providedIn: 'root'
})
export class SubscriptionPlanApi {
  private http = inject(HttpClient);

  private plansUrl = `${environment.platformProviderApiBaseUrl}${environment.plansEndpointPath}`;
  private subscriptionsUrl = `${environment.platformProviderApiBaseUrl}${environment.subscriptionsEndpointPath}`;
  private checkoutSessionsUrl = `${environment.platformProviderApiBaseUrl}${environment.checkoutSessionsEndpointPath}`;

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

  private toPlan(resource: PlanResource): Plan {
    return new Plan({
      id: resource.id,
      code: resource.code,
      name: resource.name,
      price: resource.price,
      billingPeriod: resource.billingPeriod,
      description: resource.description
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