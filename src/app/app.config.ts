import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { provideIcons } from '@ng-icons/core';
import {
  heroEnvelope,
  heroLockClosed,
  heroHeart,
  heroEye,
  heroEyeSlash,
  heroUser,
  heroBuildingOffice,
  heroShieldCheck
} from '@ng-icons/heroicons/outline';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(routes),

    provideHttpClient(withFetch()),

    provideAnimationsAsync(),

    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: './i18n/',
        suffix: '.json'
      }),
      fallbackLang: 'es'
    }),

    provideIcons({
      heroEnvelope,
      heroLockClosed,
      heroHeart,
      heroEye,
      heroEyeSlash,
      heroUser,
      heroBuildingOffice,
      heroShieldCheck
    })
  ]
};