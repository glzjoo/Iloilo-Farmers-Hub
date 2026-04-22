import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navbar links
      "nav_home": "HOME",
      "nav_shop": "SHOP",
      "nav_subscriptions": "SUBSCRIPTIONS",
      "nav_become_seller": "BECOME A SELLER",
      "nav_about": "ABOUT US",


      // Auth
      "sign_up": "Sign Up",
      "login": "Login",
      "log_out": "Log out",
      "log_out_desc": "Sign out of your account",

      // Dropdown menu
      "messages": "Messages",
      "no_unread": "No unread messages",
      "my_account": "My Account",
      "my_listing": "My Listing",
      "my_listing_desc": "View/Edit your listings",
      "settings": "Settings",
      "sell": "Sell",
      "edit_profile": "Edit Profile",

      // Language names
      "lang_english": "English",
      "lang_filipino": "Filipino",
      "lang_hiligaynon": "Hiligaynon",

      // Common
      "search": "Search",
    }
  },
  fil: {
    translation: {
      //navebars
      "nav_home": "HOME",
      "nav_shop": "MAMILI",
      "nav_subscriptions": "MGA SUBSCRIPTION",
      "nav_become_seller": "MAGING SELLER",
      "nav_about": "TUNGKOL SA AMIN",

      "sign_up": "Mag-sign Up",
      "login": "Mag-login",
      "log_out": "Mag-log out",
      "log_out_desc": "Mag-sign out sa iyong account",

      "messages": "Mga Mensahe",
      "no_unread": "Walang di-nabasa na mensahe",
      "my_account": "Aking Account",
      "my_listing": "Aking Listahan",
      "my_listing_desc": "Tignan/I-edit ang iyong mga listahan",
      "settings": "Mga Setting",
      "sell": "Magbenta",

      "lang_english": "English",
      "lang_filipino": "Filipino",
      "lang_hiligaynon": "Hiligaynon",

      "search": "Maghanap",
    }
  },
  hil: {
    translation: {
      "nav_home": "HOME",
      "nav_shop": "MAGBAKAL",
      "nav_subscriptions": "MGA SUBSCRIPTION",
      "nav_become_seller": "MAGBALIGYA",
      "nav_about": "GIKAN SA AMON",

      "sign_up": "Mag-sign Up",
      "login": "Mag-login",
      "log_out": "Mag-log out",
      "log_out_desc": "Mag-sign out sa imo nga account",

      "messages": "Mga Mensahe",
      "no_unread": "Wala sang wala nabasa nga mensahe",
      "my_account": "Akon Account",
      "my_listing": "Akon Listahan",
      "my_listing_desc": "Tan-awon/I-edit ang imo mga listahan",
      "settings": "Mga Setting",
      "sell": "Magbaligya",

      "lang_english": "English",
      "lang_filipino": "Filipino",
      "lang_hiligaynon": "Hiligaynon",

      "search": "Pangita",
    }
  }
};

// Read saved language from localStorage, default to English
const savedLanguage = localStorage.getItem('ifh_language') || 'hil';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Persist language choice to localStorage whenever it changes
i18n.on('languageChanged', (lng: string) => {
  localStorage.setItem('ifh_language', lng);
});

export default i18n;
