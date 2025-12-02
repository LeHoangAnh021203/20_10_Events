"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
// import LanguageSwitcher from "../components/language-switcher";

export default function TermsPage() {
  const { t } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 py-4 md:py-8 text-black">
      {/* <LanguageSwitcher /> */}
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Back Button */}
        <div className="mb-4 md:mb-6">
          <button
            onClick={() => window.close()}
            className="flex items-center gap-2 hover:bg-red-50 border border-red-200 bg-transparent px-4 py-2 rounded-md"
          >
            ← {t.termsBackButton}
          </button>
        </div>

        {/* Terms Content Card */}
        <div className="flex justify-center px-1 sm:px-0">
          <div className="relative bg-[#feeedd] rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full">
            {/* Header */}
            <header className="w-full">
              <Image
                src="/Holiday/Header-02.png"
                alt="Foxie Club 20.10 Special"
                width={1920}
                height={600}
                priority
                className="w-full h-auto object-cover"
              />
            </header>

            {/* Decorative Elements */}
            <div className="pointer-events-none absolute inset-0">
              {/* Top right corner decoration */}
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-orange-300 to-red-400 rounded-full opacity-60"></div>
              <div className="absolute top-8 right-8 w-8 h-8 bg-yellow-300 rounded-full opacity-70"></div>
              <div className="absolute top-12 right-2 w-6 h-6 bg-orange-200 rounded-full opacity-50"></div>

              {/* Scattered decorative shapes */}
              <div className="absolute top-20 right-12 w-4 h-4 bg-red-300 rounded-full opacity-60"></div>
              <div className="absolute top-24 right-6 w-3 h-3 bg-yellow-400 rounded-full opacity-70"></div>
              <div className="absolute top-16 right-20 w-5 h-5 bg-orange-300 rounded-full opacity-50"></div>

              {/* Bottom decorations */}
              <div className="absolute bottom-20 left-4 w-12 h-12 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-full opacity-60"></div>
              <div className="absolute bottom-16 left-8 w-6 h-6 bg-red-200 rounded-full opacity-70"></div>
              <div className="absolute bottom-12 left-12 w-4 h-4 bg-orange-200 rounded-full opacity-50"></div>

              {/* Summer Fox decorative images */}
              <div
                className={`absolute ${
                  isMobile
                    ? "top-40 left-2 w-16 opacity-70"
                    : "top-90 left-2 w-24 sm:w-28 md:w-32 opacity-80"
                } animate-float-y z-100`}
              >
                <Image
                  src="/Giáng sinh/Asset 7@4x.png"
                  alt="decorative fox"
                  width={256}
                  height={256}
                  className="w-full h-auto drop-shadow-md rotate-[-8deg]"
                  aria-hidden
                />
              </div>
              <div
                className={`absolute ${
                  isMobile
                    ? "bottom-35 left-2 w-16 opacity-70"
                    : "bottom-58 left-2 w-20 sm:w-24 md:w-28 opacity-80"
                } animate-float-x z-100`}
              >
                <Image
                  src="/Giáng sinh/Asset 12@4x.png"
                  alt="decorative fox"
                  width={256}
                  height={256}
                  className="w-full h-auto drop-shadow-md"
                  aria-hidden
                />
              </div>
              <div
                className={`absolute ${
                  isMobile
                    ? "bottom-25 right-6 w-16 opacity-80"
                    : "bottom-55 right-8 w-20 sm:w-20 md:w20 opacity-100"
                } animate-swing-60 z-100`}
              >
                <Image
                  src="/Giáng sinh/Asset 13@4x.png"
                  alt="decorative sun"
                  width={256}
                  height={256}
                  className="w-full h-auto drop-shadow-md"
                  aria-hidden
                />
              </div>
            </div>

            {/* Terms Content */}
            <div className="relative z-10 px-4 md:px-8 py-6 md:py-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-md md:rounded-lg p-4 md:p-6 border border-orange-200 shadow-sm">
                <div className="text-center mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    {t.termsTitle}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {t.termsSubtitle}
                  </p>
                </div>

                <div className="space-y-4 text-sm md:text-base text-gray-700 leading-relaxed">
                  <div>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      {t.termsContent.map((term, index) => (
                        <li key={index}>{term}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-center mt-6 pt-4 border-t border-gray-300">
                    <p className="text-xs text-gray-500">
                      {t.lastUpdate}{" "}
                      {new Date().toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="w-full mt-8">
              <Image
                src="/Holiday/Footer-03.png"
                alt="Foxie Club Footer"
                width={1920}
                height={400}
                className="w-full h-auto object-cover"
              />
            </footer>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes floatY {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes floatX {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(6px);
          }
        }
        @keyframes swing60 {
          0% {
            transform: rotate(-30deg);
          }
          50% {
            transform: rotate(30deg);
          }
          100% {
            transform: rotate(-30deg);
          }
        }
        .animate-float-y {
          animation: floatY 5s ease-in-out infinite;
        }
        .animate-float-x {
          animation: floatX 6s ease-in-out infinite;
        }
        .animate-swing-60 {
          animation: swing60 2.5s ease-in-out infinite;
          transform-origin: 50% 10%;
        }
      `}</style>
    </div>
  );
}
