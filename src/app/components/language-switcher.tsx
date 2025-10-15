"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  const getCurrentFlag = () => {
    return language === 'vi' ? '🇻🇳' : '🇺🇸';
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative">
        {/* Language Ball */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-300 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center text-2xl cursor-pointer"
        >
          {getCurrentFlag()}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-14 right-0 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 py-2 min-w-[120px]">
            <button
              onClick={() => handleLanguageChange('vi')}
              className={`w-full px-4 py-2 text-left hover:bg-orange-50 transition-colors flex items-center gap-2 ${
                language === 'vi' ? 'bg-orange-100 text-orange-700' : 'text-gray-700'
              }`}
            >
              <span className="text-lg">🇻🇳</span>
              <span className="text-sm font-medium">VN</span>
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`w-full px-4 py-2 text-left hover:bg-orange-50 transition-colors flex items-center gap-2 ${
                language === 'en' ? 'bg-orange-100 text-orange-700' : 'text-gray-700'
              }`}
            >
              <span className="text-lg">🇺🇸</span>
              <span className="text-sm font-medium">EN</span>
            </button>
          </div>
        )}

        {/* Backdrop to close dropdown */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-[-1]" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
