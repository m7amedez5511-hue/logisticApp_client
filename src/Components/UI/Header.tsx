import { Button } from "./Button";
import { Input } from "./Input";
import { Select } from "./Select";

export default function Header({
  state,
  search,
  setSearch,
  module,
  setModule,
  setPage,
  title,
  mainTitle,
  name,
  isAudit = false,
  onAdd,
}: {
  state: any;
  search: string;
  setSearch: (search: string) => void;
  module: string;
  setModule: (module: string) => void;
  setPage: (page: number) => void;
  title: string;
  mainTitle: string;
  name: string;
  isAudit?: boolean;
  onAdd?: () => void;
}) {
  return (
    <header
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        padding: "1.5rem 2rem",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#2563EB",
          fontWeight: 600,
        }}
      >
        {title}
      </p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            {mainTitle}
          </h1>
          <p
            style={{
              marginTop: "0.25rem",
              fontSize: 13,
              color: "var(--color-text-muted)",
            }}
          >
            إجمالي{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>
              {state.total}
            </strong>{" "}
            {name}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <Input
            label="بحث"
            type="text"
            placeholder="ابحث..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            dir="rtl"
            className="w-[220px]"
          />
          {isAudit ? (
            <Select
              value={module}
              onChange={(e) => {
                setModule(e.target.value);
                setPage(1);
              }}
              dir="rtl"
              className="w-[180px]"
            >
              <option value="">كل الوحدات</option>
              {[
                "User",
                "Driver",
                "Car",
                "Trip",
                "Order",
                "Client",
                "Role",
                "Branch",
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          ) : (
            <Button onClick={onAdd}>
              <i className="ti ti-plus" style={{ fontSize: 14 }} aria-hidden="true" />
              إضافة {name}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}