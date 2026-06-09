"use client";
import { useState, useEffect, useCallback } from "react";
import { loadSession, type ClientSession }  from "@/lib/session";
import RegisterStep   from "../..//Components/Client/client";
import DashboardStep  from "../../Components/Order/order";
import AddressStep    from "../../Components/Client_Adress/clientAdress";
import Logo           from "../../utils/logo";
import { Spinner }    from "../../Components/UI";

type Step = "bootstrap" | "register" | "address" | "dashboard";

function Navbar({ session }: { session: ClientSession | null }) {
  return (
    <nav
      aria-label="Client portal navigation"
      className="bg-white border-b border-[#E5E7EB] flex items-center justify-between px-5 h-14 sticky top-0 z-30"
    >
      <div className="flex items-center gap-2">
        {session?.name && (
          <span className="text-[12px] text-[#6B7280] hidden sm:block">{session.name}</span>
        )}
        <div aria-hidden="true" className="w-8 h-8 rounded-full bg-[#EBF3FF] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A73E8" strokeWidth="2">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </div>
      </div>
      <Logo />
    </nav>
  );
}

export default function ClientOrderPage() {
  const [step,    setStep]    = useState<Step>("bootstrap");
  const [session, setSession] = useState<ClientSession | null>(null);

  useEffect(() => {
    const saved = loadSession();
    if (saved?.id && saved.name) {
      setSession(saved);
      setStep("dashboard");
    } else {
      setStep("register");
    }
  }, []);

  const handleRegistered = useCallback((s: ClientSession) => {
    setSession(s);
    setStep("address");
  }, []);

  const handleAddressComplete = useCallback(() => {
    setStep("dashboard");
  }, []);

  return (
    <div
      className="min-h-screen bg-[#ECEEF2]"
      dir="rtl"
      lang="ar"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <Navbar session={session} />

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">

          {step === "bootstrap" && (
            <div className="flex flex-col items-center justify-center py-10 gap-3" role="status">
              <Spinner size="lg" />
              <p className="text-[13px] text-[#6B7280]">جارٍ تحميل بيانات الجلسة…</p>
            </div>
          )}

          {step === "register" && (
            <RegisterStep onSuccess={handleRegistered} />
          )}

          {step === "address" && session && (
            <AddressStep session={session} onSuccess={handleAddressComplete} />
          )}

          {step === "dashboard" && session && (
            <DashboardStep session={session} />
          )}
        </div>

        <p className="text-center text-[11px] text-[#9CA3AF] mt-4">
          LogiFlow · آمن ومشفر · المملكة العربية السعودية 🇸🇦
        </p>
      </div>
    </div>
  );
}