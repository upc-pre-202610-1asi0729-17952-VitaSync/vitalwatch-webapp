import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiRequest = request.url.startsWith(environment.platformProviderApiBaseUrl);

  if (!isApiRequest) {
    return next(request);
  }

  const rawSession =
    sessionStorage.getItem('vitalwatch-session') ?? localStorage.getItem('vitalwatch-session');

  if (!rawSession) {
    return next(request);
  }

  try {
    const session = JSON.parse(rawSession);
    const token = session?.token;

    if (!token) {
      return next(request);
    }

    const authenticatedRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next(authenticatedRequest);
  } catch {
    return next(request);
  }
};
