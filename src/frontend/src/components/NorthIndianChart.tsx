import { type ChartCusp, type ChartPlanet, SIGN_ABBR } from "@/lib/kpEngine";

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
  Ne: "#000080",
  Ur: "#cc4400",
  Pl: "#333333",
  As: "#cc8800",
};

const HINDI_ABBR: Record<string, string> = {
  Su: "सू",
  Mo: "चं",
  Ma: "मं",
  Me: "बु",
  Ju: "गु",
  Ve: "शु",
  Sa: "श",
  Ra: "रा",
  Ke: "के",
  Ur: "यू",
  Ne: "ने",
  Pl: "प्लू",
  As: "ल",
};

// North Indian chart: H1 top-center, going COUNTER-CLOCKWISE (left first)
// Row 1: H2 | H1 | H12
// Row 2: H3 | ctr | H11
// Row 3: H4 | ctr | H10
// Row 4: H5 | ctr | H9
// Row 5: H6 | H7 | H8
const HOUSE_GRID: Record<number, [number, number]> = {
  2: [1, 1],
  1: [1, 2],
  12: [1, 3],
  3: [2, 1],
  11: [2, 3],
  4: [3, 1],
  10: [3, 3],
  5: [4, 1],
  9: [4, 3],
  6: [5, 1],
  7: [5, 2],
  8: [5, 3],
};

interface Props {
  planets: ChartPlanet[];
  ascendant: ChartPlanet;
  cusps: ChartCusp[];
  labelMode?: "english" | "hindi";
  mode?: "natal" | "bhavchalit";
  title?: string;
}

function getPlanetsInSign(
  sign: number,
  planets: ChartPlanet[],
  ascendant: ChartPlanet,
): ChartPlanet[] {
  const all = [...planets, ascendant];
  return all.filter((p) => p.sign === sign);
}

function getPlanetsInBhava(
  bhavaHouse: number,
  planets: ChartPlanet[],
  ascendant: ChartPlanet,
): ChartPlanet[] {
  const all = [...planets, ascendant];
  return all.filter((p) => p.bhavaHouse === bhavaHouse);
}

export default function NorthIndianChart({
  planets,
  ascendant,
  cusps,
  labelMode = "english",
  mode = "natal",
  title,
}: Props) {
  const lagnaSign = ascendant.sign;
  const getSignForNatalHouse = (houseNum: number) =>
    (lagnaSign + houseNum - 1) % 12;

  const getLabel = (abbr: string) => {
    if (labelMode === "hindi") return HINDI_ABBR[abbr] || abbr;
    return abbr;
  };

  const isHindi = labelMode === "hindi";
  const isBhavchalit = mode === "bhavchalit";

  const houseNums = Object.keys(HOUSE_GRID).map(Number);

  const centerLabel = isBhavchalit ? "Bhav" : "KP";
  const centerSub = isBhavchalit ? "Chalit" : "Chart";

  return (
    <div>
      {title && (
        <div
          style={{
            textAlign: "center",
            fontSize: "11px",
            fontWeight: 700,
            color: "#c17d00",
            marginBottom: "4px",
            letterSpacing: "0.04em",
          }}
        >
          {title}
        </div>
      )}
      <div
        role="img"
        aria-label={
          isBhavchalit ? "Bhavchalit Chart" : "North Indian KP Astrology Chart"
        }
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "1fr 1fr 1fr 1fr 1fr",
          width: "100%",
          maxWidth: 420,
          aspectRatio: "3/5",
          border: isBhavchalit ? "2px solid #0066aa" : "2px solid #c17d00",
          margin: "0 auto",
          backgroundColor: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* House cells */}
        {houseNums.map((houseNum) => {
          const [row, col] = HOUSE_GRID[houseNum];

          // Determine sign abbreviation
          let signAbbr: string;
          let planetsHere: ChartPlanet[];

          if (isBhavchalit) {
            // Each house cell shows the sign from the cusp of that house
            const cuspSign = cusps[houseNum - 1]?.sign ?? 0;
            signAbbr = SIGN_ABBR[cuspSign];
            planetsHere = getPlanetsInBhava(houseNum, planets, ascendant);
          } else {
            const sign = getSignForNatalHouse(houseNum);
            signAbbr = SIGN_ABBR[sign];
            planetsHere = getPlanetsInSign(sign, planets, ascendant);
          }

          const isLagna = houseNum === 1;
          const borderColor = isBhavchalit ? "#0066aa" : "#c17d00";
          const lagnaColor = isBhavchalit ? "#e6f2ff" : "#fffbe6";

          return (
            <div
              key={houseNum}
              style={{
                gridRow: row,
                gridColumn: col,
                border: `1px solid ${borderColor}`,
                backgroundColor: isLagna ? lagnaColor : "white",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* House number */}
              <span
                style={{
                  fontSize: "7px",
                  color: "#aaa",
                  lineHeight: 1,
                  marginBottom: "1px",
                }}
              >
                H{houseNum}
              </span>

              {/* Sign abbreviation */}
              <span
                style={{
                  fontSize: "9px",
                  color: isBhavchalit ? "#0066aa" : "#c17d00",
                  opacity: 0.7,
                  fontWeight: 600,
                  lineHeight: 1,
                  marginBottom: "2px",
                }}
              >
                {signAbbr}
              </span>

              {/* ASC label */}
              {isLagna && (
                <span
                  style={{
                    fontSize: "7px",
                    color: isBhavchalit ? "#0066aa" : "#c17d00",
                    fontWeight: 700,
                    lineHeight: 1,
                    marginBottom: "1px",
                  }}
                >
                  ASC
                </span>
              )}

              {/* Planets */}
              {planetsHere.map((p) => {
                const planetColor = PLANET_COLORS[p.abbr] || "#333";
                const degInt = Math.floor(p.degrees);
                return (
                  <div
                    key={p.name}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      lineHeight: 1,
                      marginBottom: "1px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "6px",
                        color: planetColor,
                        fontWeight: 500,
                      }}
                    >
                      {degInt}°{p.retrograde ? "R" : ""}
                    </span>
                    <span
                      style={{
                        fontSize: isHindi ? "9px" : "8px",
                        color: planetColor,
                        fontWeight: 700,
                        fontFamily: isHindi
                          ? "Noto Sans Devanagari, sans-serif"
                          : undefined,
                      }}
                    >
                      {getLabel(p.abbr)}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Center cell spanning rows 2–4, col 2 */}
        <div
          style={{
            gridRow: "2 / span 3",
            gridColumn: 2,
            border: `1px solid ${isBhavchalit ? "#0066aa" : "#c17d00"}`,
            backgroundColor: isBhavchalit ? "#f0f8ff" : "#fff8f0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Decorative diamond using CSS border trick */}
          <div
            style={{
              position: "absolute",
              width: "60%",
              paddingBottom: "60%",
              border: `1px solid ${isBhavchalit ? "#0066aa" : "#c17d00"}`,
              transform: "rotate(45deg)",
              opacity: 0.3,
            }}
          />
          <span
            style={{
              fontSize: "12px",
              color: isBhavchalit ? "#0066aa" : "#c17d00",
              fontWeight: 700,
              letterSpacing: "0.05em",
              zIndex: 1,
              lineHeight: 1.2,
            }}
          >
            {centerLabel}
          </span>
          <span
            style={{
              fontSize: "9px",
              color: isBhavchalit ? "#0066aa" : "#c17d00",
              zIndex: 1,
            }}
          >
            {centerSub}
          </span>
        </div>
      </div>
    </div>
  );
}
