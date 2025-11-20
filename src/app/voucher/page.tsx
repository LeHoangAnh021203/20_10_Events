"use client";

import Hero from "../components/hero";
import { useState, useEffect } from "react";


export default function VoucherPage() {
 
  const [, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <main className="min-h-screen">
      {/* Keep original Hero component */}
      <div className="positon">
        <Hero />
      </div>
      {/* Add voucher selection section below Hero */}
    </main>
  );
}
