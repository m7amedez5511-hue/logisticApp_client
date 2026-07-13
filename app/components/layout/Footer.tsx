import Logo from "@/src/utils/logo";

export function Footer() {
  return (
    <footer className="bg-[#0F172A] text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 text-[13px] lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Logo white={true} />
          <div className="text-center text-white/40">
            © 2026 Slash.sa. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>)
}