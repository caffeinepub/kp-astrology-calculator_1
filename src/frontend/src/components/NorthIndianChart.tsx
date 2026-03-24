import { type ChartCusp, type ChartPlanet, SIGN_ABBR } from "@/lib/kpEngine";

const PLANET_COLORS: Record<string, string> = {
  Su: "#cc0000",
  Mo: "#887700",
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

interface Props {
  planets: ChartPlanet[];
  ascendant: ChartPlanet;
  cusps: ChartCusp[];
  labelMode?: "english" | "hindi";
  mode?: "natal" | "bhavchalit";
  title?: string;
}

// SVG chart dimensions
const S = 360; // Total size
const C = S / 2; // Center = 180
const OFF = 90; // Offset for inner diamond from midpoints

// Key points
// Outer corners
const TL: [number, number] = [0, 0];
const TR: [number, number] = [S, 0];
const BR: [number, number] = [S, S];
const BL: [number, number] = [0, S];
// Inner diamond corners
const DT: [number, number] = [C, OFF]; // top inner = (180,90)
const DR: [number, number] = [S - OFF, C]; // right inner = (270,180)
const DB: [number, number] = [C, S - OFF]; // bottom inner = (180,270)
const DL: [number, number] = [OFF, C]; // left inner = (90,180)
const CC: [number, number] = [C, C]; // center = (180,180)

type Pt = [number, number];

const HOUSE_POLYS: Record<number, Pt[]> = {
  1: [TL, TR, DT],
  2: [TL, DT, DL],
  3: [DL, DT, CC],
  4: [TL, BL, DL],
  5: [DL, CC, DB],
  6: [BL, DL, DB],
  7: [BL, BR, DB],
  8: [BR, DR, DB],
  9: [DR, CC, DB],
  10: [TR, BR, DR],
  11: [DT, DR, CC],
  12: [TR, DT, DR],
};

const HOUSE_CENTROIDS: Record<number, Pt> = {
  1: [180, 40],
  2: [82, 82],
  3: [145, 147],
  4: [34, 180],
  5: [145, 213],
  6: [82, 278],
  7: [180, 320],
  8: [278, 278],
  9: [215, 213],
  10: [326, 180],
  11: [215, 147],
  12: [278, 82],
};

function polyStr(pts: Pt[]): string {
  return pts.map((p) => `${p[0]},${p[1]}`).join(" ");
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
  const borderColor = mode === "bhavchalit" ? "#0066aa" : "#c17d00";
  const lagnaFill = mode === "bhavchalit" ? "#ddeeff" : "#fffbe6";
  const isHindi = labelMode === "hindi";

  const getPlanetsInHouse = (houseNum: number): ChartPlanet[] => {
    const all = [...planets, ascendant];
    if (mode === "bhavchalit") {
      return all.filter((p) => p.bhavaHouse === houseNum);
    }
    const sign = (lagnaSign + houseNum - 1) % 12;
    return all.filter((p) => p.sign === sign);
  };

  const getSignForHouse = (houseNum: number): number => {
    if (mode === "bhavchalit") {
      return cusps[houseNum - 1]?.sign ?? 0;
    }
    return (lagnaSign + houseNum - 1) % 12;
  };

  const getLabel = (abbr: string) =>
    isHindi ? HINDI_ABBR[abbr] || abbr : abbr;

  const HOUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div>
      {title && (
        <div
          style={{
            textAlign: "center",
            fontSize: "11px",
            fontWeight: 700,
            color: borderColor,
            marginBottom: "4px",
            letterSpacing: "0.04em",
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          margin: "0 auto",
        }}
      >
        <svg
          viewBox={`0 0 ${S} ${S}`}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            overflow: "visible",
          }}
          role="img"
          aria-label={
            mode === "bhavchalit"
              ? "Bhavchalit Chart"
              : "North Indian KP Astrology Chart"
          }
        >
          {/* Background */}
          <rect
            x="0"
            y="0"
            width={S}
            height={S}
            fill="white"
            stroke={borderColor}
            strokeWidth="2"
          />

          {/* House polygon fills */}
          {HOUSES.map((h) => (
            <polygon
              key={h}
              points={polyStr(HOUSE_POLYS[h])}
              fill={h === 1 ? lagnaFill : "white"}
              stroke={borderColor}
              strokeWidth="1"
            />
          ))}

          {/* House labels and planets */}
          {HOUSES.map((h) => {
            const [cx, cy] = HOUSE_CENTROIDS[h];
            const planetsHere = getPlanetsInHouse(h);
            const signAbbr = SIGN_ABBR[getSignForHouse(h)];
            const isLagna = h === 1;
            const hasManyPlanets = planetsHere.length >= 4;

            type Line = {
              text: string;
              color: string;
              size: number;
              bold: boolean;
            };
            const lines: Line[] = [];

            // House number (small, light)
            lines.push({
              text: String(h),
              color: "#bbb",
              size: 7,
              bold: false,
            });

            // Sign abbreviation
            lines.push({
              text: signAbbr,
              color: borderColor,
              size: 7,
              bold: true,
            });

            // ASC label for H1
            if (isLagna) {
              lines.push({
                text: "ASC",
                color: borderColor,
                size: 7,
                bold: true,
              });
            }

            // Planets — compact format: `Su22°` (no space before degree)
            for (const p of planetsHere) {
              const deg = Math.floor(p.degrees);
              const retroStr = p.retrograde ? "R" : "";
              const col = PLANET_COLORS[p.abbr] || "#333";
              lines.push({
                text: `${getLabel(p.abbr)}${deg}°${retroStr}`,
                color: col,
                size: isHindi ? 8 : 7.5,
                bold: true,
              });
            }

            // Use smaller line height for crowded houses
            const lineH = hasManyPlanets ? 8 : 9;
            const totalH = lines.length * lineH;
            const startY = cy - totalH / 2 + lineH * 0.65;

            return (
              <g key={h}>
                {lines.map((line, i) => (
                  <text
                    key={`h${h}-${i}-${line.text}`}
                    x={cx}
                    y={startY + i * lineH}
                    textAnchor="middle"
                    fill={line.color}
                    fontSize={line.size}
                    fontWeight={line.bold ? "bold" : "normal"}
                    fontFamily={
                      isHindi
                        ? "Noto Sans Devanagari, system-ui, sans-serif"
                        : "system-ui, sans-serif"
                    }
                  >
                    {line.text}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
