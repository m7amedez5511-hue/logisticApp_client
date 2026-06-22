import { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, wrapperClassName = "", className = "", id, ...rest },
  ref
) {
  const taId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={taId}
          className="text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={taId}
        rows={3}
        className={`
          w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800
          placeholder:text-slate-400 resize-none
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          disabled:bg-slate-50 disabled:text-slate-400
          ${error ? "border-red-400" : "border-slate-300"}
          ${className}
        `}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});