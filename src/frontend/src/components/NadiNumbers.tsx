import type { NadiPlanet, NadiRow } from "@/lib/kpEngine";

const PLANET_COLORS: Record<string, string> = {
  Su: "#cc0000",
  Mo: "#888800",
  Ma: "#8b0000",
  Me: "#006400",
  Ju: "#8b008b",
  Ve: "#006666",
  Sa: "#cc0066",
  Ra: "#8b0000",
  Ke: "#8b6914",
};

const PLANET_FULL: Record<string, string> = {
  Su: "Sun",
  Mo: "Moon",
  Ma: "Mars",
  Me: "Mercury",
  Ju: "Jupiter",
  Ve: "Venus",
  Sa: "Saturn",
  Ra: "Rahu",
  Ke: "Ketu",
};

function hexWithAlpha(hex: string, alpha: string): string {
  return hex + alpha;
}

function NumberBadges({
  numbers,
  bgColor,
}: {
  numbers: number[];
  bgColor: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "3px",
        marginTop: "2px",
      }}
    >
      {numbers.map((n) => (
        <span
          key={n}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: hexWithAlpha(bgColor, "18"),
            border: `1px solid ${hexWithAlpha(bgColor, "55")}`,
            fontSize: "10px",
            fontWeight: 700,
            color: "#000000",
            lineHeight: 1,
          }}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

function NadiRowDisplay({
  row,
  color,
  label,
}: {
  row: NadiRow;
  label: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "4px 6px",
        borderRadius: "4px",
        backgroundColor: "#fafafa",
        marginBottom: "3px",
        border: "1px solid #f0e8d0",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          color: "#888",
          fontWeight: 600,
          marginBottom: "2px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}:{" "}
        <span style={{ color: "#555", fontWeight: 700 }}>{row.name}</span>
      </div>
      <NumberBadges numbers={row.numbers} bgColor={color} />
    </div>
  );
}

interface Props {
  nadiPlanets: NadiPlanet[];
}

export default function NadiNumbers({ nadiPlanets }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "10px",
      }}
    >
      {nadiPlanets.map((np) => {
        const color = PLANET_COLORS[np.abbr] || "#c17d00";
        const fullName = PLANET_FULL[np.abbr] || np.abbr;
        return (
          <div
            key={np.abbr}
            data-ocid={`nadi.${np.abbr.toLowerCase()}.card`}
            style={{
              border: `1.5px solid ${hexWithAlpha(color, "44")}`,
              borderRadius: "8px",
              backgroundColor: "white",
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            {/* Card header */}
            <div
              style={{
                backgroundColor: hexWithAlpha(color, "14"),
                borderBottom: `1px solid ${hexWithAlpha(color, "33")}`,
                padding: "5px 8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: color,
                  color: "white",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                {np.abbr}
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: color,
                }}
              >
                {fullName}
              </span>
            </div>

            {/* Rows */}
            <div style={{ padding: "6px" }}>
              <NadiRowDisplay row={np.planet} label="Planet" color={color} />
              <NadiRowDisplay
                row={np.nakLord}
                label="Nak Lord"
                color="#c17d00"
              />
              <NadiRowDisplay row={np.subLord} label="Sub Lord" color="#666" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
