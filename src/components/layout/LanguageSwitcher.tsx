import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import languageIcon from '../../assets/icons/language-logo.svg';

const languages = [
  { code: 'en', labelKey: 'lang_english' },
  { code: 'fil', labelKey: 'lang_filipino' },
  { code: 'hil', labelKey: 'lang_hiligaynon' },
];

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLabel = languages.find(l => l.code === i18n.language)?.labelKey || 'lang_english';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-white"
      >
        <img src={languageIcon} className="w-5 h-5 brightness-0 invert" alt="" />
        <span className="text-xs font-heading">{t(currentLabel)}</span>
        <span className="text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg overflow-hidden z-[60]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code);
                setOpen(false);
              }}
              className={`w-full font-heading text-left px-4 py-2.5 text-sm border-none cursor-pointer transition-colors ${i18n.language === lang.code
                ? 'bg-green-50 text-primary font-semibold'
                : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              {t(lang.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
