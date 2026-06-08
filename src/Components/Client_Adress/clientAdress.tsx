"use client";
import React, { useState, useEffect, type FC } from "react";
import { type ClientSession } from "@/src/utils/helperFun";
import Spinner from "../Spinner/spinner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

// ─── Types ───────────────────────────────────
export interface ClientAddress {
  _id: string;
  label: string;
  branchName: string | null;
  contactPerson: { name: string; phone: string };
  details: {
    city: string;
    district?: string;
    street: string;
    buildingNo?: string;
    unitNo?: string;
    zipCode?: string;
  };
}

interface AddrForm {
  label: string;
  branchName: string;
  contactName: string;
  contactPhone: string;
  city: string;
  district: string;
  street: string;
  buildingNo: string;
  unitNo: string;
  zipCode: string;
}

interface AddrErrors {
  city?: string;
  street?: string;
  zipCode?: string;
  contactPhone?: string;
}



interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}
const Input: FC<InputProps> = ({ label, error, className = "", ...rest }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[12px] font-semibold text-[#374151]">{label}</label>
    <input
      className={`w-full h-10 px-3 border rounded-lg text-[13px] text-[#111827]
        placeholder-[#9CA3AF] outline-none transition focus:border-[#1A73E8]
        focus:ring-2 focus:ring-[#1A73E8]/15 text-right
        ${error ? "border-red-400 bg-red-50" : "border-[#E5E7EB] bg-white"} ${className}`}
      dir="rtl"
      {...rest}
    />
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

// ─── AddressStep ─────────────────────────────
interface AddressStepProps {
  session: ClientSession;
  onSuccess: () => void;
}

const LABEL_OPTIONS = ["عام", "المنزل", "المكتب الرئيسي", "المستودع", "الفرع"];

const AddressStep: FC<AddressStepProps> = ({ session, onSuccess }) => {
  const [savedAddresses, setSavedAddresses] = useState<ClientAddress[]>([]);
  const [loadingAddrs,   setLoadingAddrs]   = useState(true);
  const [selectedId,     setSelectedId]     = useState<string | null>(null);
  const [showNew,        setShowNew]        = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [apiError,       setApiError]       = useState("");
  const [formErrors,     setFormErrors]     = useState<AddrErrors>({});
  const [form, setForm] = useState<AddrForm>({
    label: "عام", branchName: "", contactName: "", contactPhone: "",
    city: "", district: "", street: "", buildingNo: "", unitNo: "", zipCode: "",
  });

  // get saved addresses on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/client/${session.id}/addresses`);
        const data = await res.json();
        if (res.ok) {
          // api might return either { addresses: [...] } or just [...]
          const list: ClientAddress[] = Array.isArray(data) ? data : (data.addresses ?? []);
          setSavedAddresses(list);
          // auto-select first address if available
          if (list.length > 0) setSelectedId(list[0]._id);
        }
      } catch {
        // ignore fetch errors, user can add address manually
        setShowNew(true);
      } finally {
        setLoadingAddrs(false);
      }
    })();
  }, [session.id]);

  const setF =
    (field: keyof AddrForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(p => ({ ...p, [field]: e.target.value }));
      if (formErrors[field as keyof AddrErrors])
        setFormErrors(p => ({ ...p, [field]: undefined }));
    };

  const validateAddress = (): boolean => {
    const e: AddrErrors = {};
    if (!form.city.trim())   e.city   = "المدينة مطلوبة";
    if (!form.street.trim()) e.street = "الشارع مطلوب";
    if (form.zipCode && !/^\d{5}$/.test(form.zipCode))
      e.zipCode = "الرمز البريدي يجب أن يتكون من 5 أرقام";
    if (form.contactPhone && !/^(\+966|0)?[5][0-9]{8}$/.test(form.contactPhone.replace(/\s/g, "")))
      e.contactPhone = "أدخل رقم جوال سعودي صحيح";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const canProceed = selectedId !== null || showNew;

  const handleNext = async () => {
    if (selectedId) {
      // existing address selected → proceed without API call
      setLoading(true);
      await new Promise(r => setTimeout(r, 400));
      setLoading(false);
      onSuccess();
      return;
    }
    if (showNew && !validateAddress()) return;
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch(`${API_BASE}/client/${session.id}/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label:      form.label,
          branchName: form.branchName || null,
          contactPerson: {
            name:  form.contactName,
            phone: form.contactPhone,
          },
          details: {
            city:       form.city.trim(),
            district:   form.district.trim() || undefined,
            street:     form.street.trim(),
            buildingNo: form.buildingNo.trim() || undefined,
            unitNo:     form.unitNo.trim() || undefined,
            zipCode:    form.zipCode.trim() || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "تعذّر حفظ العنوان");
      onSuccess();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "تعذّر حفظ العنوان، يرجى المحاولة مجددًا.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 bg-[#D1FAE5] border border-[#A7F3D0] rounded-full px-3 py-1 text-[11px] font-bold text-[#065F46] mb-3">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          تم إنشاء الحساب
        </div>
        <h2 className="text-[22px] font-bold text-[#111827] tracking-tight leading-tight">اختر عنوان التوصيل</h2>
        <p className="text-[13px] text-[#6B7280] mt-1">
          العنوان <strong className="text-[#111827]">مطلوب</strong> قبل تقديم أي طلب.
        </p>
      </div>

      {apiError && (
        <div className="mb-4">
          <Alert message={apiError} onClose={() => setApiError("")} />
        </div>
      )}

      {/* loading state */}
      {loadingAddrs ? (
        <div className="flex items-center justify-center py-8 gap-2">
          <Spinner />
          <span className="text-[13px] text-[#6B7280]">جارٍ تحميل العناوين…</span>
        </div>
      ) : (
        <>
          {/* saved addresses */}
          {savedAddresses.length > 0 && (
            <div className="mb-5">
              <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-2">العناوين المحفوظة</p>
              <div className="flex flex-col gap-2">
                {savedAddresses.map(addr => (
                  <button
                    key={addr._id}
                    type="button"
                    onClick={() => { setSelectedId(addr._id); setShowNew(false); }}
                    className={`w-full text-right border rounded-xl p-3.5 transition-all duration-150 ${
                      selectedId === addr._id
                        ? "border-[#1A73E8] bg-[#EBF3FF] ring-2 ring-[#1A73E8]/15"
                        : "border-[#E5E7EB] bg-white hover:border-[#1A73E8]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                        selectedId === addr._id ? "border-[#1A73E8] bg-[#1A73E8]" : "border-[#D1D5DB]"
                      }`}>
                        {selectedId === addr._id && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            addr.label === "المكتب الرئيسي"
                              ? "bg-[#EBF3FF] text-[#1E3A8A]"
                              : "bg-[#FEF3C7] text-[#92400E]"
                          }`}>
                            {addr.label}
                          </span>
                          {addr.branchName && (
                            <span className="text-[12px] text-[#6B7280]">{addr.branchName}</span>
                          )}
                        </div>
                        <p className="text-[13px] font-semibold text-[#111827]">
                          {addr.details.street}
                          {addr.details.buildingNo && `، مبنى ${addr.details.buildingNo}`}
                          ، {addr.details.city}
                        </p>
                        {addr.details.district && (
                          <p className="text-[12px] text-[#6B7280]">
                            {addr.details.district}
                            {addr.details.zipCode && ` · ${addr.details.zipCode}`}
                          </p>
                        )}
                        <p className="text-[11px] text-[#9CA3AF] mt-1">
                          {addr.contactPerson.name} · {addr.contactPerson.phone}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* new address button */}
          <button
            type="button"
            onClick={() => { setShowNew(v => !v); setSelectedId(null); }}
            className={`w-full border-2 border-dashed rounded-xl p-3 flex items-center justify-center gap-2
              text-[13px] font-semibold transition-all ${
              showNew
                ? "border-[#1A73E8] text-[#1A73E8] bg-[#EBF3FF]"
                : "border-[#E5E7EB] text-[#6B7280] hover:border-[#1A73E8]/50 hover:text-[#1A73E8]"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            إضافة عنوان جديد
          </button>

          {/* new address form */}
          {showNew && (
            <div className="mt-4 border border-[#E5E7EB] rounded-xl p-4 bg-[#FAFAFA] flex flex-col gap-3">
              <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide">تفاصيل العنوان الجديد</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-[#374151]">التصنيف</label>
                  <select
                    value={form.label}
                    onChange={setF("label")}
                    className="h-10 px-3 border border-[#E5E7EB] rounded-lg text-[13px] text-[#111827]
                      bg-white outline-none focus:border-[#1A73E8] focus:ring-2
                      focus:ring-[#1A73E8]/15 text-right"
                    dir="rtl"
                  >
                    {LABEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <Input label="اسم الفرع" placeholder="مقر الرياض" value={form.branchName} onChange={setF("branchName")} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="اسم جهة الاتصال" placeholder="أحمد الرشيدي" value={form.contactName} onChange={setF("contactName")} />
                <Input label="رقم جوال جهة الاتصال" placeholder="+966 50 123 4567" value={form.contactPhone} onChange={setF("contactPhone")} error={formErrors.contactPhone} />
              </div>

              <div className="h-px bg-[#E5E7EB]" />

              <div className="grid grid-cols-2 gap-3">
                <Input label="المدينة *"  placeholder="الرياض"          value={form.city}     onChange={setF("city")}     error={formErrors.city} />
                <Input label="الحي"       placeholder="العليا"           value={form.district} onChange={setF("district")} />
              </div>
              <Input   label="الشارع *"   placeholder="طريق الملك فهد"  value={form.street}   onChange={setF("street")}   error={formErrors.street} />
              <div className="grid grid-cols-3 gap-3">
                <Input label="رقم المبنى"    placeholder="12"    value={form.buildingNo} onChange={setF("buildingNo")} />
                <Input label="رقم الوحدة"   placeholder="3ب"    value={form.unitNo}     onChange={setF("unitNo")} />
                <Input label="الرمز البريدي" placeholder="12241" value={form.zipCode}    onChange={setF("zipCode")}    error={formErrors.zipCode} />
              </div>
            </div>
          )}
        </>
      )}

      {!canProceed && !loadingAddrs && (
        <p className="text-[12px] text-[#F59E0B] font-medium mt-3 flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          يرجى اختيار عنوان أو إضافة عنوان جديد للمتابعة.
        </p>
      )}

      <div className="mt-6">
        <PrimaryBtn onClick={handleNext} loading={loading} disabled={!canProceed || loadingAddrs} className="w-full">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          التالي — عرض الطلبات
        </PrimaryBtn>
      </div>
    </div>
  );
};

export default AddressStep;