import '@formatjs/intl-pluralrules/polyfill';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import en from '../i18n/en.json';
import ar from '../i18n/ar.json';

const LANG_KEY = 'qadsiah-lang';

export async function initI18n() {
  if (i18n.isInitialized) return i18n;
  const stored = (await AsyncStorage.getItem(LANG_KEY)) || null;
  const deviceLang = Localization.getLocales()?.[0]?.languageCode || 'ar';
  const lng = stored || (deviceLang === 'ar' ? 'ar' : 'en');

  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, ar: { translation: ar } },
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  applyDirection(lng);
  return i18n;
}

export async function setLanguage(lang) {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANG_KEY, lang);
  applyDirection(lang);
}

function applyDirection(lang) {
  const rtl = lang === 'ar';
  if (I18nManager.isRTL !== rtl) {
    try {
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
      // Note: full layout flip requires reload in production builds.
    } catch (_e) {
      /* noop */
    }
  }
}

export default i18n;
