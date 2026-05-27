import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideIcons } from '@ng-icons/core';
import {
  heroEnvelope,
  heroLockClosed,
  heroEye,
  heroEyeSlash,
  heroUser,
  heroPhone,
  heroBriefcase,
  heroHeart,
  heroSquares2x2,
  heroUsers,
  heroCreditCard,
  heroDocumentText,
  heroShieldCheck,
  heroCog6Tooth,
  heroArrowLeftOnRectangle,
  heroExclamationTriangle,
  heroBell,
  heroBolt,
  heroClipboardDocumentCheck,
  heroCalendarDays,
  heroClock,
  heroCheckCircle,
  heroXCircle,
  heroPaperAirplane,
  heroClipboardDocument,
  heroTrash,
  heroNoSymbol,
  heroUserGroup,
  heroPlus,
  heroPlayCircle,
  heroStopCircle,
  heroDocumentChartBar
} from '@ng-icons/heroicons/outline';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
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
      heroEye,
      heroEyeSlash,
      heroUser,
      heroPhone,
      heroBriefcase,
      heroHeart,
      heroSquares2x2,
      heroUsers,
      heroCreditCard,
      heroDocumentText,
      heroShieldCheck,
      heroCog6Tooth,
      heroArrowLeftOnRectangle,
      heroExclamationTriangle,
      heroBell,
      heroBolt,
      heroClipboardDocumentCheck,
      heroCalendarDays,
      heroClock,
      heroCheckCircle,
      heroXCircle,
      heroPaperAirplane,
      heroClipboardDocument,
      heroTrash,
      heroNoSymbol,
      heroUserGroup,
      heroPlus,
      heroPlayCircle,
      heroStopCircle,
      heroDocumentChartBar
    }),
    provideRouter(routes)
  ]
};