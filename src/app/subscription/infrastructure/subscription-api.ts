import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CheckoutSessionRequest } from './checkout-session-request';
import { CheckoutSessionResponse } from './checkout-session-response';

interface PlanResource {
  id: number;
  code: string;
  name: string;
  price: number;
  billingPeriod: string;
}

interface OrganizationResource {
  id: number;
  name: string;
  ruc: string;
  address: string;
  phone: string;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  planId: number;
}

interface UserResource {
  id: number;
  organizationId: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'HOSPITAL_ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
}

interface SubscriptionResource {
  id: number;
  organizationId: number;
  planId: number;
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED';
  startedAt: string | null;
}

interface CheckoutSessionResource {
  id: number;
  organizationId: number;
  administratorId: number;
  subscriptionId: number;
  planId: number;
  planCode: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionApi {
  private http = inject(HttpClient);

  private baseUrl = environment.platformProviderApiBaseUrl;
  private plansUrl = `${this.baseUrl}${environment.plansEndpointPath}`;
  private organizationsUrl = `${this.baseUrl}${environment.organizationsEndpointPath}`;
  private usersUrl = `${this.baseUrl}${environment.usersEndpointPath}`;
  private subscriptionsUrl = `${this.baseUrl}${environment.subscriptionsEndpointPath}`;
  private checkoutSessionsUrl = `${this.baseUrl}${environment.checkoutSessionsEndpointPath}`;

  createCheckoutSession(request: CheckoutSessionRequest): Observable<CheckoutSessionResponse> {
    return this.http.get<PlanResource[]>(`${this.plansUrl}?code=${request.planCode}`).pipe(
      switchMap(plans => {
        const plan = plans[0];

        if (!plan) {
          throw new Error('Selected plan was not found.');
        }

        const organizationPayload = {
          ...request.organization,
          status: 'PENDING',
          planId: plan.id
        };

        return this.http.post<OrganizationResource>(this.organizationsUrl, organizationPayload).pipe(
          switchMap(organization => {
            const administratorPayload = {
              organizationId: organization.id,
              firstName: request.administrator.firstName,
              lastName: request.administrator.lastName,
              email: request.administrator.email,
              password: request.administrator.password,
              role: 'HOSPITAL_ADMIN',
              status: 'PENDING'
            };

            return this.http.post<UserResource>(this.usersUrl, administratorPayload).pipe(
              switchMap(administrator => {
                const subscriptionPayload = {
                  organizationId: organization.id,
                  planId: plan.id,
                  status: 'PENDING',
                  startedAt: null
                };

                return this.http.post<SubscriptionResource>(this.subscriptionsUrl, subscriptionPayload).pipe(
                  switchMap(subscription => {
                    const checkoutPayload = {
                      organizationId: organization.id,
                      administratorId: administrator.id,
                      subscriptionId: subscription.id,
                      planId: plan.id,
                      planCode: plan.code,
                      status: 'PENDING',
                      createdAt: new Date().toISOString()
                    };

                    return this.http.post<CheckoutSessionResource>(this.checkoutSessionsUrl, checkoutPayload);
                  })
                );
              })
            );
          })
        );
      }),
      map(session => ({
        id: session.id,
        checkoutUrl: `/onboarding/checkout/${session.id}`,
        status: session.status
      }))
    );
  }

  getCheckoutSession(id: number): Observable<CheckoutSessionResource> {
    return this.http.get<CheckoutSessionResource>(`${this.checkoutSessionsUrl}/${id}`);
  }

  completeCheckoutSession(id: number): Observable<void> {
    return this.getCheckoutSession(id).pipe(
      switchMap(session => {
        const completedAt = new Date().toISOString();

        return forkJoin([
          this.http.patch(`${this.checkoutSessionsUrl}/${session.id}`, {
            status: 'COMPLETED'
          }),
          this.http.patch(`${this.organizationsUrl}/${session.organizationId}`, {
            status: 'ACTIVE'
          }),
          this.http.patch(`${this.usersUrl}/${session.administratorId}`, {
            status: 'ACTIVE'
          }),
          this.http.patch(`${this.subscriptionsUrl}/${session.subscriptionId}`, {
            status: 'ACTIVE',
            startedAt: completedAt
          })
        ]);
      }),
      map(() => void 0)
    );
  }

  cancelCheckoutSession(id: number): Observable<void> {
    return this.http.patch(`${this.checkoutSessionsUrl}/${id}`, {
      status: 'CANCELLED'
    }).pipe(
      map(() => void 0)
    );
  }
}