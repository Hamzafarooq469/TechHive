// src/services/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import your translations
import english from "../locales/en/english.json";
import urdu from "../locales/ur/urdu.json";
import spanish from "../locales/es/spanish.json";
import chinese from "../locales/zh/chinese.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: english },
      ur: { translation: urdu },
      es: { translation: spanish },
      zh: { translation: chinese },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
  });

export default i18n;
