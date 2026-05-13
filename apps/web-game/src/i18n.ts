import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import trTranslation from './locales/tr.json';
import enTranslation from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      tr: { translation: trTranslation }
    },
    lng: 'tr', // Varsayılan dil
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React zaten XSS'i önler
    }
  });

export default i18n;
