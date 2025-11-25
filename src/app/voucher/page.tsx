"use client";

import Hero from "../components/hero";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

function VoucherPageContent() {
  const router = useRouter();
  const [, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <main className="min-h-screen">
      {/* Back to Home Button */}
      <div className="absolute container mx-auto px-4 sm:px-6 pt-4 md:pt-6 z-100">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 hover:bg-orange-50 border border-orange-300 bg-white text-orange-600 px-4 py-2 rounded-md transition-colors shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Quay lại trang chủ
        </button>
      </div>
      
      {/* Keep original Hero component */}
      <div className="positon">
        <Hero />
      </div>
      {/* Add voucher selection section below Hero */}
    </main>
  );
}

export default function VoucherPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VoucherPageContent />
    </Suspense>
  );
}
