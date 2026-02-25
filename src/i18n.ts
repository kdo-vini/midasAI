import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationPT from './locales/pt/translation.json';

const resources = {
    pt: {
        translation: translationPT
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'pt',
        fallbackLng: 'pt',
        debug: true,
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        }
    });

export default i18n;
