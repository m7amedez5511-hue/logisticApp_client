export default function ForbiddenPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#020617_0%,#111827_45%,#172554_100%)] text-slate-100 flex items-center justify-center px-6 py-10">
      <section className="w-full max-w-xl rounded-3xl border border-rose-400/20 bg-slate-900/85 p-8 shadow-2xl shadow-slate-950/30 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-rose-200">Access denied</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">You do not have permission to open this section.</h1>
        <p className="mt-3 text-slate-300">Contact an administrator to request access to the required module.</p>
        <a href="/dashboard" className="mt-6 inline-flex rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">Return to dashboard</a>
      </section>
    </main>
  );
}
