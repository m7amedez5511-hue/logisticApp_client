"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { Alert } from "@/src/Components/UI";
import { getStoredToken } from "@/src/lib/auth";
import { get } from "@/src/services/api";
import Header from "@/src/Components/UI/Header";
import { AuditTable } from "@/src/Components/audit/AuditTable";
import { AuditDetailModal } from "@/src/Components/audit/AuditDetailsModel";
import { AuditLog } from "@/src/types/audit";

// ── Types ──────────────────────────────────────────────────────────────────
// (AuditLog itself now lives in @/src/types/audit so AuditTable and
// AuditDetailModal can both import it — same pattern as Driver/Order.)

// ── State / Reducer ────────────────────────────────────────────────────────

interface State {
  logs: AuditLog[];
  loading: boolean;
  total: number;
  pages: number;
  error: string | null;
}

type Action =
  | { type: "LOAD_START" }
  | { type: "LOAD_OK"; logs: AuditLog[]; total: number; pages: number }
  | { type: "LOAD_ERR"; error: string }
  | { type: "CLEAR_ERR" };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "LOAD_START":
      return { ...s, loading: true, error: null };
    case "LOAD_OK":
      return {
        ...s,
        loading: false,
        logs: a.logs,
        total: a.total,
        pages: a.pages,
      };
    case "LOAD_ERR":
      return { ...s, loading: false, error: a.error };
    case "CLEAR_ERR":
      return { ...s, error: null };
    default:
      return s;
  }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [state, dispatch] = useReducer(reducer, {
    logs: [],
    loading: true,
    total: 0,
    pages: 1,
    error: null,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = useCallback(async (q: string, mod: string) => {
    dispatch({ type: "LOAD_START" });
    try {
      const token = getStoredToken();
      // Show ALL matching logs at once instead of paginating — a high
      // limit stands in for "no limit" against an endpoint that still
      // expects page/limit params. If the backend enforces its own hard
      // cap below this number, ask it to expose an explicit "all" mode
      // instead of relying on this number being high enough.
      const params = new URLSearchParams({ page: "1", limit: "1000" });
      if (q) params.set("search", q);
      if (mod) params.set("module", mod);
      const res = await get<{
        data: {
          data: AuditLog[];
          meta?: { total: number; pages: number };
          pagination?: { total: number; pages: number };
        };
      }>(`audit?${params}`, token);
      const payload = (
        res as unknown as {
          data: {
            data: AuditLog[];
            meta?: { total: number; pages: number };
            pagination?: { total: number; pages: number };
          };
        }
      ).data;
      dispatch({
        type: "LOAD_OK",
        logs: payload.data ?? [],
        total: payload.meta?.total ?? payload.pagination?.total ?? 0,
        pages: payload.meta?.pages ?? payload.pagination?.pages ?? 1,
      });
    } catch {
      dispatch({
        type: "LOAD_ERR",
        error: "تعذّر تحميل سجل التدقيق. يرجى المحاولة مجدداً.",
      });
    }
  }, []);

  useEffect(() => {
    loadLogs(search, module);
  }, [search, module, loadLogs]);

  return (
    <>
      <section
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
      {/* Header */}
      <Header
        state={state}
        search={search}
        setSearch={setSearch}
        module={module}
        setModule={setModule}
        setPage={setPage}
        title={"الامتثال والمراجعة"}
        mainTitle={"سجل التدقيق"}
        name = {"سجل"}
        isAudit={true}
      />

      {state.error && (
        <Alert
          type="error"
          message={state.error}
          onClose={() => dispatch({ type: "CLEAR_ERR" })}
        />
      )}

      {/* Table */}
      <AuditTable
        logs={state.logs}
        loading={state.loading}
        search={search}
        page={page}
        pages={state.pages}
        onPageChange={setPage}
        onRowClick={(log) => setSelectedLog(log)}
      />
    </section>

    {selectedLog && (
      <AuditDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    )}
    </>
  );
}