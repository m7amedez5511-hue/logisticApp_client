"use client";

import React, { useState, type FC, type FormEvent } from "react";
import { saveSession, type ClientSession } from "@/lib/session";
import { clientService } from "@/services/client.service";
import { Spinner }  from "../../Components/UI";
import { Alert }   from "../../Components/UI";
import { Button }  from "../../Components/UI";
import { Input }   from "../../Components/UI";

// ─── Types ───────────────────────────────────
interface RegForm {
  name:        string;
  email:       string;
  phone:       string;
  companyName: string;
}

interface RegErrors {
  name?:  string;
  email?: string;
  phone?: string;
}

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
      const data = await clientService.create({
        name:        form.name.trim(),
        email:       form.email.trim(),
        phone:       form.phone.trim(),
        companyName: form.companyName.trim() || undefined,
      });

      const session: ClientSession = {
        id:    data.id,
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
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]" />
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
          autoComplete="name"
        />
        <Input
          label="البريد الإلكتروني *"
          type="email"
          placeholder="ahmed@company.sa"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          label="رقم الجوال *"
          type="tel"
          placeholder="+966 50 123 4567"
          value={form.phone}
          onChange={set("phone")}
          error={errors.phone}
          autoComplete="tel"
        />
        <Input
          label="اسم الشركة (اختياري)"
          placeholder="شركة لوجي فلو للتوصيل"
          value={form.companyName}
          onChange={set("companyName")}
          autoComplete="organization"
        />

        <div className="pt-2">
          <Button type="submit" loading={loading} fullWidth>
            إنشاء الحساب
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegisterStep;