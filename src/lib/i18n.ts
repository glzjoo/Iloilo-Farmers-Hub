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

      //famer registration
      "first_name": "First Name",
      "last_name": "Last Name",
      "email": "Email",
      "farm_name": "Farm Name",
      "farm_location": "Farm Location",
      "additional_address_details": "Additional Address Details",
      "contact_number": "Contact Number",
      "farm_type": "Farm Type",
      "clear_all": "Clear All",
      "continue_to_verification": "Continue to Verification",
      "verification": "Verification",
      "submit": "Submit",
      "verification_number": "Verification Number",
      "verification_number_desc": "Enter the verification number sent to your phone number",
      "resend_code": "Resend code",
      "verify_identity": "Verify identity (ID + Selfie)",
      "create_account": "We'll send OTP to your phone to create your account. No password needed!",
      "next_steps": "Next Steps",
      "farmer_information": "Farmer's Information",

      //consumer registration
      "consumer_info": "Consumer's Information",
      "consumer.we_will_send_otp": "We'll send a 6-digit OTP",
      "consumer.to_verify_your_phone_number": "to verify your phone number",
      "consumer_continue_to_otp": "Continue to OTP",
      "consumer_sending_otp": "Sending OTP...",
      "consumer.first_name": "First name",
      "consumer.last_name": "Last name",
      "consumer.email": "Email",
      "consumer.home_address": "Home Address",
      "consumer.contact_number": "Contact Number",
      "consumer.interest": "What do you want to buy?",
      "consumer.clear_all": "Clear All",
      "continue_to_otp": "Continue to OTP",
      "consumer.sending_otp": "Sending OTP...",
      "consumer.verify_identity": "Verify identity (ID + Selfie)",
      "consumer.create_account": "We'll send OTP to your phone to create your account. No password needed!",
      "consumer.next_steps": "Next Steps",


      //shop all,
      "filter_price": "Price",
      "filter_reset": "Reset",
      "search_products": "Search Products",
      "adding_to_cart": "Adding...",
      "product_not_found": "Product not found",
      "back_to_shop": "Back to Shop",

      //nearby farmers
      "browse_all_products": "Browse All Products",
      "select_your_location": "Select your location",
      "select_location_to_continue": "Select location to continue:",
      "all_barangays": "All barangays",
      "using_gps_location": "Using GPS Location",
      "nearby_farmers": "Nearby Farmers",
      "loading": "Loading...",
      "location_error": "Location unavailable. Please select location manually.",
      "select_location": "Select location",
      "select_city": "Select city...",
      "apply_location": "Apply Location",
      "use_gps": "Use GPS",
      "use_manual": "Use Manual",

      //Item Section
      "favorite": "Favorite",
      "out_of_stock": "Out of Stock",
      "add_to_favorites": "Add to Favorites",
      "message_seller": "Message Seller",

      //filter items
      "filter_title": "Filters",
      "filter_clear": "Clear",
      "filter_trending": "Trending Now",
      "filter_sort": "Sort By",
      "filter_categories": "Categories",
      "filter_min": "Min",
      "filter_max": "Max",
      "filter_apply_price": "Apply Price",
      "filter_price_range": "Price Range",




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


      //shop all
      "filter_all": "Ifilter",
      "filter_category": "Kategorya",
      "filter_price": "Presyo",
      "filter_reset": "I-reset",
      "search_products": "Hanapin ang mga Produkto",
      "add_to_cart": "Idagdag sa paborito",
      "adding_to_cart": "Nag-a-add...",
      "product_not_found": "Walang nakitang produkto",
      "back_to_shop": "Balik sa Shop",

      //farmer registration
      "first_name": "Pangalan",
      "last_name": "Apelyido",
      "email": "Email",
      "farm_name": "Pangalan ng Farm",
      "farm_location": "Lokasyon ng Farm",
      "additional_address_details": "Ibang detalye ng address",
      "contact_number": "Numero ng Telepono",
      "farm_type": "Uri ng Farm",
      "clear_all": "Burahin Lahat",
      "continue_to_verification": "Ipagpatuloy sa Pag-verify",
      "verification": "Pag-verify",
      "submit": "ISubmit",

      //consumer registration tagalog
      "consumer_info": "Impormasyon ng Konsyumer",
      "consumer.we_will_send_otp": "Magpapadala kami ng 6-digit OTP",
      "consumer.to_verify_your_phone_number": "para i-verify ang iyong numero ng telepono",
      "consumer_continue_to_otp": "Magpatuloy sa OTP",
      "consumer_sending_otp": "Nagpapadala ng OTP...",
      "consumer.first_name": "Pangalan",
      "consumer.last_name": "Apelyido",
      "consumer.email": "Email",
      "consumer.home_address": "Address",
      "consumer.contact_number": "Numero ng Telepono",
      "consumer.interest": "Ano ang gusto mong bilhin?",
      "consumer.clear_all": "Burahin Lahat",
      "consumer_verify_identity": "Patunayan ang pagkakakilanlan (ID + Selfie)",
      "consumer_create_account": "Magpapadala kami ng OTP sa iyong telepono para gumawa ng account. Hindi kailangan ng password!",
      "consumer_next_steps": "Mga Susunod na Hakbang",
      "continue_to_otp": "Magpatuloy sa OTP",


      //filter items
      "filter_title": "I-filter",
      "filter_clear": "I-clear",
      "filter_trending": "Trending Now",
      "filter_sort": "I-sort",
      "filter_categories": "Kategorya",
      "filter_min": "Min",
      "filter_max": "Max",
      "filter_apply_price": "I-apply ang Presyo",
      "filter_price_range": "Saklaw ng Presyo",
      "nearby_farmers": "Hanapin ang mga magsasaka malapit sa iyo",
      "select_location": "Piliin ang lokasyon",
      "select_city": "Piliin ang lungsod",
      "select_barangay": "Piliin ang barangay",
      "apply_manual": "I-apply nang manual",
      "use_current_location": "Gamitin ang kasalukuyang lokasyon",
      "location_error": "Hindi makuha ang iyong lokasyon",
      "loading": "Nag-lo-load...",
      "select_location_to_continue": "Piliin ang lokasyon para magpatuloy",

      //nearby farmers
      "browse_all_products": "Browse All Products",
      "select_your_location": "Select your location",
      "all_barangays": "All barangays",
      "using_gps_location": "Using GPS Location",
      "apply_location": "Apply Location",
      "use_gps": "Use GPS",
      "use_manual": "Use Manual",

      //Item Section
      "favorite": "Paborito",
      "out_of_stock": "Wala sa Stok",
      "add_to_favorites": "Idagdag sa Paborito",
      "message_seller": "I-message ang Seller",

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

      //registration farmer hiligaynon
      "verification": "Pag-verify",
      "first_name": "Ngalan",
      "last_name": "Apelyido",
      "email": "Email",
      "farm_name": "Ngalan sang Uma",
      "farm_location": "Lokasyon sang Uma",
      "additional_address_details": "Mas detalyado nga address",
      "contact_number": "Selpon Number",
      "farm_type": "Uri sang Uma",
      "clear_all": "Kwaon Tanan",
      "continue_to_verification": "Padayon sa Pag-verify",
      "submit": "Isumite",

      //consumer registration hiligaynon
      "consumer_info": "Impormasyon sang Konsyumer",
      "consumer.we_will_send_otp": "Mapadala kami sang 6-digit OTP",
      "consumer.to_verify_your_phone_number": "para i-verify ang imo nga number",
      "consumer_continue_to_otp": "Magpadayon sa OTP",
      "consumer_sending_otp": "Nagsend kami sang OTP...",
      "consumer.first_name": "Pangalan",
      "consumer.last_name": "Apelyido",
      "consumer.email": "Email",
      "consumer.home_address": "Address",
      "consumer.contact_number": "Selpon Number",
      "consumer.interest": "Ano ang gusto mo baklon?",
      "consumer.clear_all": "Kwaon Tanan",
      "consumer_verify_identity": "Pagpamatud-i ang pagkilala (ID + Selfie)",
      "consumer_create_account": "Mapadala kami sang OTP sa imo nga telepono para sa paghimo sang imo nga account. Indi kailangan sang password!",
      "consumer_next_steps": "Mga Masunod nga Tikang",
      "continue_to_otp": "Magpadayon sa OTP",




      //Item Section
      "favorite": "Paborito",
      "out_of_stock": "Wala sa Stock",
      "add_to_favorites": "I-add sa Paborito",
      "message_seller": "Estoryahon ang Manugbaligya",

      //shop filter
      "filter_title": "I-filter",
      "filter_clear": "I-clear",
      "filter_trending": "Mga uso nga produkto",
      "filter_sort": "I-sort",
      "filter_categories": "Kategorya",
      "filter_min": "Pinaka-ubos",
      "filter_max": "Pinaka-taas",
      "filter_apply_price": "I-apply ang Presyo",
      "filter_price_range": "Presyu",


      //nearby farmers
      "select_location_to_continue": "Pili-a ang lokasyon mo",
      "browse_all_products": "Lantaw tanan nga produkto",
      "select_your_location": "Pili-a ang lokasyon mo",
      "all_barangays": "Tanan nga barangay",
      "using_gps_location": "Gamit ang GPS",
      "apply_location": "I-apply ang lokasyon",
      "use_gps": "Gamiton ang GPS",
      "use_manual": "Manual nga Pagpili",

      //shop all
      "filter_all": "I-filter",
      "filter_category": "Kategorya",
      "filter_price": "Presyu",
      "filter_reset": "I-reset",
      "search_products": "Pangitaon ang mga Produkto",
      "add_to_cart": "Idugang sa paborito",
      "adding_to_cart": "Nagadugang...",
      "product_not_found": "Walay nakit-an nga produkto",
      "back_to_shop": "Balik sa Shop",

      "messages": "Mga Mensahe",
      "no_unread": "Wala sang wala nabasa nga mensahe",
      "my_account": "Akon Account",
      "my_listing": "Akon Listahan",
      "my_listing_desc": "Tan-awon/I-edit ang imo mga listahan",
      "settings": "Mga Setting",
      "sell": "Magbaligya",
      "edit_profile": "Edit Profile",

      "lang_english": "English",
      "lang_filipino": "Filipino",
      "lang_hiligaynon": "Hiligaynon",

      "search": "Pangita",

    }
  }
};

// Read saved language from localStorage, default to Hiligaynon
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
