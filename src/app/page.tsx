"use client";
import type React from "react";
import GreetingCard from "./components/greeting-card";
// import LanguageSwitcher from "./components/language-switcher";
import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter, useSearchParams } from "next/navigation";

interface FormData {
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  message: string;
}

function LandingPageContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notification, setNotification] = useState<{
    title: string;
    description?: string;
    variant?: "destructive" | "success";
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!notification) return;
    const id = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(id);
  }, [notification]);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const [showGreetingCard, setShowGreetingCard] = useState(false);
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>({
    senderName: "",
    senderPhone: "",
    senderEmail: "",
    receiverName: "",
    receiverPhone: "",
    receiverEmail: "",
    message: "",
  });

  // Helpers for word counting and limiting
  const countWords = (text: string) => {
    const t = text.trim();
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  };
  const clampWords = (text: string, maxWords: number) => {
    const t = text.trim();
    if (!t) return "";
    const parts = t.split(/\s+/);
    if (parts.length <= maxWords) return text;
    return parts.slice(0, maxWords).join(" ");
  };

  useEffect(() => {
    if (showGreetingCard) return;
    const shouldShow = searchParams.get("showGreetingCard") === "1";
    if (!shouldShow) return;
    if (typeof window === "undefined") return;

    const orderId = searchParams.get("orderId");
    
    // Nếu có orderId, load từ API (trường hợp từ email link)
    const loadFromOrderId = async () => {
      if (orderId) {
        try {
          console.log("🔄 Loading formData from orderId:", orderId);
          const response = await fetch(`/api/payment/get-order?orderId=${orderId}`);
          if (response.ok) {
            const orderData = await response.json();
            if (orderData.formData) {
              setSubmittedData(orderData.formData);
              setShowGreetingCard(true);
              
              if (orderData.serviceName) {
                setSelectedServiceName(orderData.serviceName);
              }
              
              // Lưu vào storage để backup
              try {
                sessionStorage.setItem("formData", JSON.stringify(orderData.formData));
                if (orderData.serviceName) {
                  sessionStorage.setItem("paidServiceName", orderData.serviceName);
                }
              } catch (storageError) {
                console.warn("Could not save to storage:", storageError);
              }
              
              console.log("✅ Loaded formData from API for greeting card");
              return true;
            }
          } else {
            console.warn("⚠️ Could not load order from API:", response.status);
          }
        } catch (error) {
          console.error("Error loading formData from API:", error);
        }
      }
      return false;
    };

    // Thử load từ orderId trước
    loadFromOrderId().then((loaded) => {
      // Nếu không load được từ orderId, thử load từ storage
      if (!loaded) {
    const stored = sessionStorage.getItem("formData");
    if (stored) {
      try {
        const data: FormData = JSON.parse(stored);
        setSubmittedData(data);
        setShowGreetingCard(true);

        const storedService = sessionStorage.getItem("paidServiceName");
        if (storedService) {
          setSelectedServiceName(storedService);
        }
      } catch (error) {
        console.error("Không thể khôi phục dữ liệu thiệp:", error);
      }
    }
      }
    });
  }, [searchParams, showGreetingCard]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectService = () => {
    // Validate required fields before navigating
    const sanitizedForm: FormData = {
      senderName: formData.senderName.trim(),
      senderPhone: formData.senderPhone.trim(),
      senderEmail: formData.senderEmail.trim(),
      receiverName: formData.receiverName.trim(),
      receiverPhone: formData.receiverPhone.trim(),
      receiverEmail: formData.receiverEmail.trim(),
      message: formData.message.trim(),
    };

    // Validate required fields
    const requiredFields: Array<keyof FormData> = [
      "senderName",
      "senderPhone",
      "receiverName",
      "receiverPhone",
      "message",
    ];
    const missingFields = requiredFields.filter(
      (field) => !sanitizedForm[field]
    );

    if (missingFields.length > 0) {
      setNotification({
        title: t.requiredFields,
        description: t.requiredFieldsDesc,
        variant: "destructive",
      });
      return;
    }

    // Message length validation (max 100 words)
    if (countWords(sanitizedForm.message) > 100) {
      setNotification({
        title: t.messageTooLong,
        description: t.messageTooLongDesc,
        variant: "destructive",
      });
      return;
    }

    const nameRegex = /^[\p{L}\p{M}][\p{L}\p{M}''\-\s]{1,}$/u;
    if (
      !nameRegex.test(sanitizedForm.senderName) ||
      !nameRegex.test(sanitizedForm.receiverName)
    ) {
      setNotification({
        title: t.invalidName,
        description: t.invalidNameDesc,
        variant: "destructive",
      });
      return;
    }

    // Email validation (optional - only validate if provided)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (sanitizedForm.senderEmail && !emailRegex.test(sanitizedForm.senderEmail)) {
      setNotification({
        title: t.invalidEmail,
        description: t.invalidEmailDesc,
        variant: "destructive",
      });
      return;
    }

    if (sanitizedForm.receiverEmail && !emailRegex.test(sanitizedForm.receiverEmail)) {
      setNotification({
        title: t.invalidEmail,
        description: t.invalidEmailDesc,
        variant: "destructive",
      });
      return;
    }

    // Phone validation (Vietnamese phone number format)
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (
      !phoneRegex.test(sanitizedForm.senderPhone) ||
      !phoneRegex.test(sanitizedForm.receiverPhone)
    ) {
      setNotification({
        title: t.invalidPhone,
        description: t.invalidPhoneDesc,
        variant: "destructive",
      });
      return;
    }

    // Prevent duplicate sender/receiver email (only if both are provided)
    if (
      sanitizedForm.senderEmail &&
      sanitizedForm.receiverEmail &&
      sanitizedForm.senderEmail.toLowerCase() ===
        sanitizedForm.receiverEmail.toLowerCase()
    ) {
      setNotification({
        title: t.duplicateInfo,
        description: t.duplicateEmail,
        variant: "destructive",
      });
      return;
    }

    // Store form data in sessionStorage to pass to voucher page
    if (typeof window !== "undefined") {
      sessionStorage.setItem("formData", JSON.stringify(sanitizedForm));
    }

    // Navigate to voucher page
    router.push("/voucher");
  };

  const handleBackToForm = () => {
    setShowGreetingCard(false);
    setSubmittedData(null);
  };

  if (showGreetingCard && submittedData) {
    return (
      <GreetingCard
        formData={submittedData}
        serviceName={selectedServiceName ?? undefined}
        onBack={handleBackToForm}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-orange-50 to-yellow-50">
      {/* <LanguageSwitcher /> */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Left side falling elements */}
        <div
          className={`absolute -top-20 ${
            isMobile ? "left-12 w-16 h-16" : "left-24 w-24 h-24"
          } animate-fall-down-left opacity-30`}
        >
          <Image
            src="/20.10/Asset 5@4x.png"
            alt="falling decoration"
            width={64}
            height={64}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className={`absolute -top-20 ${
            isMobile ? "left-16 w-20 h-20" : "left-18 w-32 h-32"
          } animate-fall-down-left-delayed-1 opacity-25`}
        >
          <Image
            src="/20.10/Asset 7@4x.png"
            alt="falling decoration"
            width={48}
            height={48}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className={`absolute -top-20 ${
            isMobile ? "left-12 w-20 h-20" : "left-24 w-32 h-32"
          } animate-fall-down-left-delayed-2 opacity-20`}
        >
          <Image
            src="/20.10/aaa@4x.png"
            alt="falling decoration"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Right side falling elements */}
        <div
          className={`absolute -top-20 ${
            isMobile ? "right-12 w-10 h-10" : "right-24 w-14 h-14"
          } animate-fall-down-right opacity-35`}
        >
          <Image
            src="/20.10/Asset 6@4x.png"
            alt="falling decoration"
            width={56}
            height={56}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className={`absolute -top-20 ${
            isMobile ? "right-16 w-12 h-12" : "right-18 w-18 h-18"
          } animate-fall-down-right-delayed-1 opacity-30`}
        >
          <Image
            src="/20.10/Asset 8@4x.png"
            alt="falling decoration"
            width={40}
            height={40}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className={`absolute -top-20 ${
            isMobile ? "right-20 w-20 h-20" : "right-21 w-36 h-36"
          } animate-fall-down-right-delayed-2`}
        >
          <Image
            src="/20.10/bbb@4x.png"
            alt="falling decoration"
            width={24}
            height={24}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className={`absolute -top-20 ${
            isMobile ? "right-8 w-12 h-12" : "right-12 w-18 h-18"
          } animate-fall-down-right opacity-20`}
        >
          <Image
            src="/20.10/ccc@4x.png"
            alt="falling decoration"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Additional left side elements */}
        <div
          className={`absolute -top-20 ${
            isMobile ? "left-4 w-12 h-12" : "left-8 w-16 h-16"
          } animate-fall-down-left opacity-25`}
        >
          <Image
            src="/20.10/Asset 6@4x.png"
            alt="falling decoration"
            width={64}
            height={64}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className={`absolute -top-20 ${
            isMobile ? "left-14 w-16 h-16" : "left-18 w-22 h-22"
          } animate-fall-down-left-delayed-1 opacity-20`}
        >
          <Image
            src="/20.10/Asset 8@4x.png"
            alt="falling decoration"
            width={48}
            height={48}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className={`absolute -top-20 ${
            isMobile ? "left-10 w-18 h-18" : "left-16 w-24 h-24"
          } animate-fall-down-left-delayed-2 opacity-30`}
        >
          <Image
            src="/20.10/bbb@4x.png"
            alt="falling decoration"
            width={56}
            height={56}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className={`absolute -top-20 ${
            isMobile ? "left-16 w-20 h-20" : "left-20 w-30 h-30"
          } animate-fall-down-left opacity-15`}
        >
          <Image
            src="/20.10/ccc@4x.png"
            alt="falling decoration"
            width={40}
            height={40}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Additional right side elements */}
        <div
          className={`absolute -top-10 ${
            isMobile ? "right-12 w-14 h-14" : "right-24 w-20 h-20"
          } animate-fall-down-right opacity-30`}
        >
          <Image
            src="/20.10/Asset 5@4x.png"
            alt="falling decoration"
            width={80}
            height={80}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className={`absolute -top-20 ${
            isMobile ? "right-14 w-18 h-18" : "right-18 w-26 h-26"
          } animate-fall-down-right-delayed-1 opacity-25`}
        >
          <Image
            src="/20.10/Asset 7@4x.png"
            alt="falling decoration"
            width={64}
            height={64}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className={`absolute -top-20 ${
            isMobile ? "right-20 w-10 h-10" : "right-26 w-12 h-12"
          } animate-fall-down-right-delayed-2 opacity-20`}
        >
          <Image
            src="/20.10/aaa@4x.png"
            alt="falling decoration"
            width={48}
            height={48}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className={`absolute -top-20 ${
            isMobile ? "right-16 w-16 h-16" : "right-20 w-24 h-24"
          } animate-fall-down-right opacity-35`}
        >
          <Image
            src="/20.10/bbb@4x.png"
            alt="falling decoration"
            width={56}
            height={56}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Center elements for variety */}
        <div
          className={`absolute -top-20 left-1/2 ${
            isMobile ? "w-12 h-12" : "w-18 h-18"
          } animate-fall-down-left opacity-15 z-100`}
        >
          <Image
            src="/20.10/ccc@4x.png"
            alt="falling decoration"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className={`absolute -top-20 left-1/2 ${
            isMobile ? "w-14 h-14" : "w-20 h-20"
          } animate-fall-down-right-delayed-1 opacity-20 z-100`}
        >
          <Image
            src="/20.10/Asset 5@4x.png"
            alt="falling decoration"
            width={40}
            height={40}
            className="w-full h-full object-contain"
          />
        </div>

        {/* More scattered elements */}
        <div
          className={`absolute -top-20 ${
            isMobile ? "left-3 w-12 h-12" : "left-6 w-18 h-18"
          } animate-fall-down-left-delayed-1 opacity-25 z-100`}
        >
          <Image
            src="/20.10/Asset 6@4x.png"
            alt="falling decoration"
            width={72}
            height={72}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className={`absolute -top-20 ${
            isMobile ? "left-6 w-10 h-10" : "left-10 w-14 h-14"
          } animate-fall-down-left opacity-20 z-100`}
        >
          <Image
            src="/20.10/Asset 8@4x.png"
            alt="falling decoration"
            width={56}
            height={56}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className={`absolute -top-20 ${
            isMobile ? "right-12 w-12 h-12" : "right-16 w-16 h-16"
          } animate-fall-down-right-delayed-2 opacity-30 z-100`}
        >
          <Image
            src="/20.10/Asset 7@4x.png"
            alt="falling decoration"
            width={64}
            height={64}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className={`absolute -top-20 ${
            isMobile ? "right-6 w-6 h-6" : "right-10 w-8 h-8"
          } animate-fall-down-right opacity-25 z-100`}
        >
          <Image
            src="/20.10/aaa@4x.png"
            alt="falling decoration"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      {/* Main Content */}
      <main
        className="container mx-auto px-4 py-8 max-w-4xl text-black"
        style={{ fontFamily: "var(--font-poppins)" }}
      >
        <div className="shadow-lg border-0 backdrop-blur-sm rounded-lg bg-gradient-to-b from-[#feeedd] via-[#fef5f0] to-white overflow-hidden">
          {/* Header */}
          <header className="w-full mb-10 relative">
            <Image
              src="/Send a wish A2-02.png"
              alt="Foxie Club 20.10 Special - Món quà dành tặng cho bạn"
              width={1920}
              height={600}
              priority
              className="w-full h-auto object-contain rounded-t-lg"
              style={{ objectPosition: 'top center' }}
            />
          </header>

          <div className={`${isMobile ? "px-4" : "px-6"} pb-8 relative z-10`}>
            <div className={`${isMobile ? "space-y-6" : "space-y-8"}`}>
              {/* Sender Information */}
              <div className="space-y-4 relative">
                <div
                  className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 transform ${
                    isMobile
                      ? "w-20 opacity-15 z-0 top-[60%]"
                      : "w-32 sm:w-40 md:w-48 opacity-15 z-0 top-[80%]"
                  } pointer-events-none`}
                >
                  <div className="animate-zoom-in-out">
                    <Image
                      src="/Asset 7@4x (1).png"
                      alt="decorative fox"
                      width={256}
                      height={256}
                      className="w-full h-auto drop-shadow-md rotate-[-8deg]"
                      aria-hidden
                    />
                  </div>
                </div>
                <h3
                  className={`${
                    isMobile ? "text-lg" : "text-xl"
                  } font-semibold text-red-600 border-b-2 border-red-200 pb-2`}
                >
                  {t.senderInfo}
                </h3>
                <div
                  className={`grid grid-cols-1 ${
                    isMobile ? "gap-3" : "md:grid-cols-2 gap-4"
                  } text-black`}
                >
                  <div className="space-y-2">
                    <label
                      htmlFor="senderName"
                      className={`${
                        isMobile ? "text-xs" : "text-sm"
                      } font-medium`}
                    >
                      {t.fullName} *
                    </label>
                    <input
                      id="senderName"
                      value={formData.senderName}
                      onChange={(e) =>
                        handleInputChange("senderName", e.target.value)
                      }
                      placeholder={t.senderNamePlaceholder}
                      className={`w-full rounded-md border ${
                        isMobile ? "px-2 py-1.5 text-sm" : "px-3 py-2"
                      } focus:outline-none focus:ring-2 ${
                        formData.senderName
                          ? "border-orange-400 bg-orange-50 focus:ring-orange-400"
                          : "border-red-200 focus:ring-red-400"
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="senderPhone"
                      className={`${
                        isMobile ? "text-xs" : "text-sm"
                      } font-medium`}
                    >
                      {t.phone} *
                    </label>
                    <input
                      id="senderPhone"
                      value={formData.senderPhone}
                      onChange={(e) =>
                        handleInputChange("senderPhone", e.target.value)
                      }
                      placeholder={t.senderPhonePlaceholder}
                      className={`w-full rounded-md border ${
                        isMobile ? "px-2 py-1.5 text-sm" : "px-3 py-2"
                      } focus:outline-none focus:ring-2 ${
                        formData.senderPhone
                          ? "border-orange-400 bg-orange-50 focus:ring-orange-400"
                          : "border-red-200 focus:ring-red-400"
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-2 text-black">
                  <label
                    htmlFor="senderEmail"
                    className={`${
                      isMobile ? "text-xs" : "text-sm"
                    } font-medium`}
                  >
                    {t.email}
                  </label>
                  <input
                    id="senderEmail"
                    type="email"
                    value={formData.senderEmail}
                    onChange={(e) =>
                      handleInputChange("senderEmail", e.target.value)
                    }
                    placeholder={t.senderEmailPlaceholder}
                    className={`w-full rounded-md border ${
                      isMobile ? "px-2 py-1.5 text-sm" : "px-3 py-2"
                    } focus:outline-none focus:ring-2 ${
                      formData.senderEmail
                        ? "border-orange-400 bg-orange-50 focus:ring-orange-400"
                        : "border-red-200 focus:ring-red-400"
                    }`}
                  />
                </div>
              </div>

              {/* Receiver Information */}
              <div className="space-y-4">
                <h3
                  className={`${
                    isMobile ? "text-lg" : "text-xl"
                  } font-semibold text-red-600 border-b-2 border-red-200 pb-2`}
                >
                  {t.receiverInfo}
                </h3>
                <div
                  className={`grid grid-cols-1 ${
                    isMobile ? "gap-3" : "md:grid-cols-2 gap-4"
                  }`}
                >
                  <div className="space-y-2">
                    <label
                      htmlFor="receiverName"
                      className={`${
                        isMobile ? "text-xs" : "text-sm"
                      } font-medium`}
                    >
                      {t.fullName} *
                    </label>
                    <input
                      id="receiverName"
                      value={formData.receiverName}
                      onChange={(e) =>
                        handleInputChange("receiverName", e.target.value)
                      }
                      placeholder={t.receiverNamePlaceholder}
                      className={`w-full rounded-md border ${
                        isMobile ? "px-2 py-1.5 text-sm" : "px-3 py-2"
                      } focus:outline-none focus:ring-2 ${
                        formData.receiverName
                          ? "border-orange-400 bg-orange-50 focus:ring-orange-400"
                          : "border-red-200 focus:ring-red-400"
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="receiverPhone"
                      className={`${
                        isMobile ? "text-xs" : "text-sm"
                      } font-medium`}
                    >
                      {t.phone} *
                    </label>
                    <input
                      id="receiverPhone"
                      value={formData.receiverPhone}
                      onChange={(e) =>
                        handleInputChange("receiverPhone", e.target.value)
                      }
                      placeholder={t.receiverPhonePlaceholder}
                      className={`w-full rounded-md border ${
                        isMobile ? "px-2 py-1.5 text-sm" : "px-3 py-2"
                      } focus:outline-none focus:ring-2 ${
                        formData.receiverPhone
                          ? "border-orange-400 bg-orange-50 focus:ring-orange-400"
                          : "border-red-200 focus:ring-red-400"
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="receiverEmail"
                    className={`${
                      isMobile ? "text-xs" : "text-sm"
                    } font-medium`}
                  >
                    {t.email}
                  </label>
                  <input
                    id="receiverEmail"
                    type="email"
                    value={formData.receiverEmail}
                    onChange={(e) =>
                      handleInputChange("receiverEmail", e.target.value)
                    }
                    placeholder={t.receiverEmailPlaceholder}
                    className={`w-full rounded-md border ${
                      isMobile ? "px-2 py-1.5 text-sm" : "px-3 py-2"
                    } focus:outline-none focus:ring-2 ${
                      formData.receiverEmail
                        ? "border-orange-400 bg-orange-50 focus:ring-orange-400"
                        : "border-red-200 focus:ring-red-400"
                    }`}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-4">
                <h3
                  className={`${
                    isMobile ? "text-lg" : "text-xl"
                  } font-semibold text-red-600 border-b-2 border-red-200 pb-2`}
                >
                  {t.messageLabel}
                </h3>
                <div className="space-y-2">
                  <label
                    htmlFor="message"
                    className={`${
                      isMobile ? "text-xs" : "text-sm"
                    } font-medium`}
                  >
                    {t.message} * ({t.limitedText} {t.messageCounter})
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => {
                      const next = clampWords(e.target.value, 100);
                      handleInputChange("message", next);
                    }}
                    placeholder={t.messagePlaceholder}
                    className={`w-full ${
                      isMobile ? "min-h-24" : "min-h-32"
                    } rounded-md border ${
                      isMobile ? "px-2 py-1.5 text-sm" : "px-3 py-2"
                    } focus:outline-none focus:ring-2 resize-none ${
                      formData.message
                        ? "border-orange-400 bg-orange-50 focus:ring-orange-400"
                        : "border-red-200 focus:ring-red-400"
                    }`}
                  />
                  <div
                    className={`text-right ${
                      isMobile ? "text-xs" : "text-xs"
                    } text-gray-500`}
                  >
                    {countWords(formData.message)}/100 {t.messageCounter}
                  </div>
                </div>
              </div>

              {/* Select Service Button */}
              <div className="flex justify-center items-center ">
                <button
                  type="button"
                  onClick={handleSelectService}
                  className={`relative mb-12 flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-orange-300 hover:from-red-600 hover:to-orange-600 text-white ${
                    isMobile ? "px-6 py-2 text-base" : "px-10 py-3 text-lg"
                  } font-semibold rounded-full shadow-lg transform transition hover:scale-105`}
                >
                  <span>
                    {t.giftServiceSection || "Chọn dịch vụ và quà tặng"}
                  </span>
                  <Image
                    src="/CÁO5@4x-05.png"
                    alt="Foxie icon"
                    width={20}
                    height={20}
                    className={`${
                      isMobile ? "h-8 w-8" : "h-12 w-12"
                    } drop-shadow-xl animate-pulse`}
                    aria-hidden
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="w-full">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-8 sm:px-6">
              <div className="grid gap-3 text-center text-sm text-gray-700 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    href: "/dieu-khoan-giao-dich",
                    label: "Điều khoản giao dịch",
                  },
                  {
                    href: "/chinh-sach-thanh-toan",
                    label: "Chính sách thanh toán",
                  },
                  {
                    href: "/chinh-sach-doi-tra-hoan-tien",
                    label: "Chính sách đổi trả – hoàn tiền",
                  },
                  {
                    href: "/chinh-sach-giao-nhan",
                    label: "Chính sách giao nhận",
                  },
                  {
                    href: "/chinh-sach-bao-mat-thong-tin",
                    label: "Chính sách bảo mật thông tin",
                  },
                  {
                    href: "/chinh-sach-bao-mat-thanh-toan",
                    label: "Chính sách bảo mật thanh toán",
                  },
                  { href: "/lien-he", label: "Liên hệ" },
                ].map((link) => (
                  <div
                    key={link.href}
                    className="flex items-center justify-center"
                  >
                    <Link
                      href={link.href}
                      className="inline-flex w-full max-w-[260px] items-center justify-center rounded-full border border-orange-200 px-4 py-2 font-semibold text-orange-600 hover:bg-orange-50"
                    >
                      {link.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            <Image
              src="/Send a wish A2-03.png"
              alt="Foxie Club Calendar - Flourishing pen-hearted traodinary"
              width={1920}
              height={400}
              className="w-full h-auto object-cover"
            />
          </footer>
        </div>
      </main>

      <style jsx>{`
        @keyframes zoomInOut {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-zoom-in-out {
          animation: zoomInOut 3.5s ease-in-out infinite;
        }
      `}</style>

      {notification && (
        <div
          className={`fixed ${
            isMobile
              ? "bottom-4 right-4 left-4 max-w-none"
              : "bottom-6 right-6 max-w-sm"
          } rounded-md border ${isMobile ? "p-3" : "p-4"} shadow-lg ${
            notification.variant === "destructive"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-green-50 border-green-200 text-green-700"
          }`}
        >
          <p className={`${isMobile ? "text-sm" : ""} font-semibold`}>
            {notification.title}
          </p>
          {notification.description && (
            <p className={`${isMobile ? "text-xs" : "text-sm"} mt-1`}>
              {notification.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-red-50 via-orange-50 to-yellow-50" />
      }
    >
      <LandingPageContent />
    </Suspense>
  );
}
