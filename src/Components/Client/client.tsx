"use client";

import React, { useState, type FC, type FormEvent } from "react";
import { saveSession, type ClientSession } from "@/src/utils/helperFun";
import Spinner from "../Spinner/spinner";


const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
console.log("API_BASE:", API_BASE);
 //make sure API_BASE ends without slash
// ─── Types ───────────────────────────────────
interface RegForm {
  name: string;
  email: string;
  phone: string;
  companyName: string;
}
interface RegErrors {
  name?: string;
  email?: string;
  phone?: string;
}




interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}
const Input: FC<InputProps> = ({ label, error, icon, className = "", ...rest }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[12px] font-semibold text-[#374151]">{label}</label>
    <div className="relative">
      {icon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">{icon}</div>}
      <input
        className={`w-full h-10 ${icon ? "pr-9" : "pr-3"} pl-3 border rounded-lg text-[13px] text-[#111827]
          placeholder-[#9CA3AF] outline-none transition focus:border-[#1A73E8] focus:ring-2
          focus:ring-[#1A73E8]/15 text-right
          ${error ? "border-red-400 bg-red-50" : "border-[#E5E7EB] bg-white"} ${className}`}
        dir="rtl"
        {...rest}
      />
    </div>
    {error && <p className="text-[11px] text-red-500 font-medium text-right">{error}</p>}
  </div>
);

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}
const PrimaryBtn: FC<BtnProps> = ({ loading, children, className = "", disabled, ...rest }) => (
  <button
    disabled={loading || disabled}
    className={`flex items-center justify-center gap-2 h-11 px-6 bg-[#1A73E8] hover:bg-[#1557B0]
      active:scale-[.98] text-white font-bold text-[13px] rounded-lg transition-all duration-150
      disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    {...rest}
  >
    {loading && <Spinner />}
    {children}
  </button>
);

const Alert: FC<{ type?: "error" | "info" | "success"; message: string; onClose?: () => void }> = ({
  type = "error", message, onClose,
}) => {
  const styles = {
    error:   "bg-red-50 border-red-200 text-red-700",
    info:    "bg-blue-50 border-blue-200 text-blue-700",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  const icons = { error: "⚠", info: "ℹ", success: "✓" };
  return (
    <div className={`flex items-start gap-2 border rounded-lg px-3 py-2.5 text-[12px] font-medium ${styles[type]}`} dir="rtl">
      <span className="flex-shrink-0">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100 text-[14px] leading-none">×</button>
      )}
    </div>
  );
};

// ─── RegisterStep ────────────────────────────
interface RegisterStepProps {
  onSuccess: (s: ClientSession) => void;
}

const RegisterStep: FC<RegisterStepProps> = ({ onSuccess }) => {
  const [form,     setForm]     = useState<RegForm>({ name: "", email: "", phone: "", companyName: "" });
  const [errors,   setErrors]   = useState<RegErrors>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = (): boolean => {
    const e: RegErrors = {};
    if (!form.name.trim())
      e.name = "الاسم الكامل مطلوب";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "أدخل بريدًا إلكترونيًا صحيحًا";
    if (!/^(\+966|0)?[5][0-9]{8}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "أدخل رقم هاتف سعودي صحيح (+966 5x xxx xxxx)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch(`${API_BASE}/client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        form.name.trim(),
          email:       form.email.trim(),
          phone:       form.phone.trim(),
          companyName: form.companyName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "فشل التسجيل");

      // save session and proceed
      const session: ClientSession = {
        id:    data.id ?? data._id,
        name:  data.name,
        email: data.email,
        phone: data.phone,
      };
      saveSession(session);
      onSuccess(session);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "فشل التسجيل، يرجى المحاولة مجددًا.");
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof RegForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (errors[field as keyof RegErrors]) setErrors(p => ({ ...p, [field]: undefined }));
  };

  return (
    <div dir="rtl">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 bg-[#EBF3FF] border border-[#BFDBFE] rounded-full px-3 py-1 text-[11px] font-bold text-[#1E3A8A] mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]" />
          عميل جديد
        </div>
        <h2 className="text-[22px] font-bold text-[#111827] tracking-tight leading-tight">إنشاء حساب جديد</h2>
        <p className="text-[13px] text-[#6B7280] mt-1">أدخل بياناتك للبدء مع Slash.so.</p>
      </div>

      {apiError && (
        <div className="mb-4">
          <Alert message={apiError} onClose={() => setApiError("")} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="الاسم الكامل *"
          placeholder="أحمد الرشيدي"
          value={form.name}
          onChange={set("name")}
          error={errors.name}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
        />
        <Input
          label="البريد الإلكتروني *"
          type="email"
          placeholder="ahmed@company.sa"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>}
        />
        <Input
          label="رقم الجوال *"
          type="tel"
          placeholder="+966 50 123 4567"
          value={form.phone}
          onChange={set("phone")}
          error={errors.phone}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 10.5 19.79 19.79 0 0 1 1.64 1.9a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 7.91a16 16 0 0 0 6.18 6.18l.96-.96a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 21.9 16.9l.02.02z"/></svg>}
        />
        <Input
          label="اسم الشركة (اختياري)"
          placeholder="شركة لوجي فلو للتوصيل"
          value={form.companyName}
          onChange={set("companyName")}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>}
        />

        <div className="pt-2">
          <PrimaryBtn type="submit" loading={loading} className="w-full">
            إنشاء الحساب
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </PrimaryBtn>
        </div>
      </form>
    </div>
  );
};

export default RegisterStep;