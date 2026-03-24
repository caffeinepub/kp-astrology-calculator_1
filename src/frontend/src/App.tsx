import DashaSection from "@/components/DashaSection";
import NadiNumbers from "@/components/NadiNumbers";
import NorthIndianChart from "@/components/NorthIndianChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type AyanamsaType,
  type ChartPlanet,
  type ChartResult,
  SIGN_ABBR,
  calculateKPChart,
  calculateNadiNumbers,
  calculateTransitPlanets,
  formatDeg,
} from "@/lib/kpEngine";
import { Loader2, MapPin, RefreshCw, Star } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface FormState {
  date: string;
  time: string;
  place: string;
  lat: string;
  lon: string;
  tz: string;
  ayanamsa: AyanamsaType;
}

const DEFAULT_FORM: FormState = {
  date: "1990-01-15",
  time: "08:30",
  place: "Mumbai, India",
  lat: "19.0760",
  lon: "72.8777",
  tz: "5.5",
  ayanamsa: "kp-new",
};

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function App() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<ChartResult | null>(null);
  const [labelMode, setLabelMode] = useState<"english" | "hindi">("english");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Transit state
  const [transitDate, setTransitDate] = useState(todayString);
  const [transitTime, setTransitTime] = useState("12:00");
  const [transitPlanets, setTransitPlanets] = useState<ChartPlanet[] | null>(
    null,
  );
  const [isTransitCalc, setIsTransitCalc] = useState(false);

  const updateForm = (field: keyof FormState, val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const handleGeocode = async () => {
    if (!form.place.trim()) return;
    setIsGeocoding(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.place)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      if (data && data.length > 0) {
        updateForm("lat", Number.parseFloat(data[0].lat).toFixed(4));
        updateForm("lon", Number.parseFloat(data[0].lon).toFixed(4));
        toast.success(
          `Found: ${data[0].display_name.split(",").slice(0, 3).join(", ")}`,
        );
      } else {
        toast.error("Place not found. Please enter coordinates manually.");
      }
    } catch {
      toast.error("Geocoding failed. Check your internet connection.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleCalculate = () => {
    try {
      setIsCalculating(true);
      const [y, m, d] = form.date.split("-").map(Number);
      const [hr, min] = form.time.split(":").map(Number);
      const lat = Number.parseFloat(form.lat);
      const lon = Number.parseFloat(form.lon);
      const tz = Number.parseFloat(form.tz);
      if (Number.isNaN(lat) || Number.isNaN(lon) || Number.isNaN(tz)) {
        toast.error("Please enter valid latitude, longitude and UTC offset.");
        return;
      }
      const chart = calculateKPChart(
        y,
        m,
        d,
        hr,
        min,
        lat,
        lon,
        tz,
        form.ayanamsa,
      );
      setResult(chart);
      setTransitPlanets(null); // reset transit when new natal is calculated
      setTimeout(() => {
        document
          .getElementById("chart-result")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (e) {
      toast.error(
        `Calculation error: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const handleTransitCalculate = () => {
    if (!result) return;
    try {
      setIsTransitCalc(true);
      const [y, m, d] = transitDate.split("-").map(Number);
      const [hr, min] = transitTime.split(":").map(Number);
      const lat = Number.parseFloat(form.lat);
      const lon = Number.parseFloat(form.lon);
      const tz = Number.parseFloat(form.tz);
      // Pass natal trop cusps so transit planets are placed in natal houses
      const natalTropCusps = result.cusps.map((c) => c.tropLon);
      const tp = calculateTransitPlanets(
        y,
        m,
        d,
        hr,
        min,
        lat,
        lon,
        tz,
        result.ayanamsaType,
        natalTropCusps,
      );
      setTransitPlanets(tp);
    } catch (e) {
      toast.error(
        `Transit error: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsTransitCalc(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setForm(DEFAULT_FORM);
    setTransitPlanets(null);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(var(--background))" }}
    >
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b border-border/60 backdrop-blur-md"
        style={{ background: "oklch(var(--card) / 0.92)" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
            <span
              className="font-bold text-lg tracking-tight"
              style={{ color: "oklch(var(--foreground))" }}
            >
              KP Astrology
            </span>
          </div>
          <span className="text-xs text-muted-foreground ml-1 hidden sm:block">
            Krishnamurti Paddhati Calculator
          </span>
          {result && (
            <button
              type="button"
              onClick={handleReset}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              data-ocid="app.secondary_button"
            >
              <RefreshCw className="w-3 h-3" /> New Chart
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Tabs defaultValue="horoscope" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger data-ocid="horoscope.tab" value="horoscope">
              Horoscope
            </TabsTrigger>
            <TabsTrigger data-ocid="planets.tab" value="planets">
              Planets &amp; Houses
            </TabsTrigger>
            <TabsTrigger data-ocid="transit.tab" value="transit">
              Transit
            </TabsTrigger>
          </TabsList>

          {/* ====== TAB 1: HOROSCOPE ====== */}
          <TabsContent value="horoscope" className="space-y-6">
            {/* Birth Form */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="rounded-xl border shadow-gold bg-card p-5 space-y-4">
                <h2 className="font-semibold text-base text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  Birth Details
                </h2>

                {/* Ayanamsa */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground font-medium">
                    Ayanamsa:
                  </span>
                  <div className="flex rounded-lg overflow-hidden border border-border">
                    {(["kp-new", "kp-old"] as AyanamsaType[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        data-ocid="ayanamsa.toggle"
                        onClick={() => updateForm("ayanamsa", v)}
                        className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                          form.ayanamsa === v
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {v === "kp-new" ? "KP New" : "KP Old"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor="dob"
                      className="text-xs text-muted-foreground"
                    >
                      Date of Birth
                    </Label>
                    <Input
                      id="dob"
                      data-ocid="birth.input"
                      type="date"
                      value={form.date}
                      onChange={(e) => updateForm("date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="tob"
                      className="text-xs text-muted-foreground"
                    >
                      Time of Birth
                    </Label>
                    <Input
                      id="tob"
                      data-ocid="time.input"
                      type="time"
                      value={form.time}
                      onChange={(e) => updateForm("time", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="tz"
                      className="text-xs text-muted-foreground"
                    >
                      UTC Offset (hrs)
                    </Label>
                    <Input
                      id="tz"
                      data-ocid="timezone.input"
                      type="number"
                      step="0.5"
                      value={form.tz}
                      onChange={(e) => updateForm("tz", e.target.value)}
                      placeholder="5.5 for IST"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                    <Label
                      htmlFor="place"
                      className="text-xs text-muted-foreground"
                    >
                      Place of Birth
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="place"
                        data-ocid="place.input"
                        value={form.place}
                        onChange={(e) => updateForm("place", e.target.value)}
                        placeholder="City, Country"
                        onKeyDown={(e) => e.key === "Enter" && handleGeocode()}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        data-ocid="geocode.button"
                        onClick={handleGeocode}
                        disabled={isGeocoding}
                        className="shrink-0 border-primary/40 hover:bg-primary/10"
                      >
                        {isGeocoding ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                        <span className="ml-1 hidden sm:inline">Look Up</span>
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="lat"
                      className="text-xs text-muted-foreground"
                    >
                      Latitude
                    </Label>
                    <Input
                      id="lat"
                      data-ocid="lat.input"
                      type="number"
                      step="0.0001"
                      value={form.lat}
                      onChange={(e) => updateForm("lat", e.target.value)}
                      placeholder="19.0760"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="lon"
                      className="text-xs text-muted-foreground"
                    >
                      Longitude
                    </Label>
                    <Input
                      id="lon"
                      data-ocid="lon.input"
                      type="number"
                      step="0.0001"
                      value={form.lon}
                      onChange={(e) => updateForm("lon", e.target.value)}
                      placeholder="72.8777"
                    />
                  </div>
                </div>

                <Button
                  data-ocid="calculate.primary_button"
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="w-full sm:w-auto text-sm font-semibold"
                  style={{
                    background: "oklch(var(--primary))",
                    color: "oklch(var(--primary-foreground))",
                  }}
                >
                  {isCalculating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      Calculate KP Chart
                    </>
                  )}
                </Button>
              </div>
            </motion.section>

            {/* Results */}
            {result ? (
              <motion.section
                id="chart-result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-5"
              >
                {/* Info bar */}
                <div className="rounded-xl border border-border bg-card px-4 py-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {form.date} · {form.time} · {form.place}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 border-amber-300"
                  >
                    ASC: {result.ascendant.signName}{" "}
                    {formatDeg(result.ascendant.degrees)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 border-amber-300"
                  >
                    Ayanamsa: {result.ayanamsa.toFixed(4)}°
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 border-amber-300"
                  >
                    {result.ayanamsaType === "kp-new" ? "KP New" : "KP Old"}
                  </Badge>
                </div>

                {/* Two charts side by side */}
                <div className="flex flex-col lg:flex-row gap-5">
                  {/* Natal Chart (left) */}
                  <div className="lg:w-1/2 rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm text-foreground">
                        Natal Chart (Rashi)
                      </h3>
                      {/* Label mode toggle */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          data-ocid="label.toggle"
                          onClick={() => setLabelMode("english")}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-l-md border transition-colors ${
                            labelMode === "english"
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-muted-foreground border-border hover:bg-accent"
                          }`}
                        >
                          EN
                        </button>
                        <button
                          type="button"
                          data-ocid="label.toggle"
                          onClick={() => setLabelMode("hindi")}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-r-md border-t border-r border-b transition-colors ${
                            labelMode === "hindi"
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-muted-foreground border-border hover:bg-accent"
                          }`}
                          style={{
                            fontFamily: "Noto Sans Devanagari, sans-serif",
                          }}
                        >
                          हि
                        </button>
                      </div>
                    </div>
                    <NorthIndianChart
                      planets={result.planets}
                      ascendant={result.ascendant}
                      cusps={result.cusps}
                      labelMode={labelMode}
                      mode="natal"
                    />
                  </div>

                  {/* Bhavchalit Chart (right) */}
                  <div className="lg:w-1/2 rounded-xl border border-blue-200 bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: "#0066aa" }}
                      >
                        Bhavchalit Chart
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        Shifted planet positions
                      </span>
                    </div>
                    <NorthIndianChart
                      planets={result.planets}
                      ascendant={result.ascendant}
                      cusps={result.cusps}
                      labelMode={labelMode}
                      mode="bhavchalit"
                    />
                  </div>
                </div>

                {/* Dasha (full width) */}
                <div className="w-full">
                  <DashaSection dasha={result.dasha} />
                </div>

                {/* Nadi Planet Numbers */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground">
                      Nadi Planet Numbers
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      (Planet · Nak Lord · Sub Lord significance)
                    </span>
                  </div>
                  <NadiNumbers
                    nadiPlanets={calculateNadiNumbers(
                      result.planets,
                      result.ascendant.sign,
                    )}
                  />
                </div>
              </motion.section>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center py-16 text-muted-foreground"
              >
                <Star className="w-12 h-12 mx-auto mb-4 text-primary/30" />
                <p className="font-medium">
                  Enter birth details above and click{" "}
                  <strong>Calculate KP Chart</strong>
                </p>
                <p className="text-sm mt-1">
                  North Indian chart with Bhavchalit and Vimshottari Dasha will
                  appear here
                </p>
              </motion.div>
            )}
          </TabsContent>

          {/* ====== TAB 2: PLANETS & HOUSES ====== */}
          <TabsContent value="planets" className="space-y-4">
            {result ? (
              <>
                {/* Planet Details */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">
                      Planet Details
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs">Planet</TableHead>
                          <TableHead className="text-xs">Sign</TableHead>
                          <TableHead className="text-xs">Degree</TableHead>
                          <TableHead className="text-xs">Nakshatra</TableHead>
                          <TableHead className="text-xs">Pada</TableHead>
                          <TableHead className="text-xs">Nak Lord</TableHead>
                          <TableHead className="text-xs">Sub Lord</TableHead>
                          <TableHead className="text-xs">Natal H</TableHead>
                          <TableHead className="text-xs">Bhava H</TableHead>
                          <TableHead className="text-xs">R</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...result.planets, result.ascendant].map((p, i) => (
                          <TableRow
                            key={p.name}
                            data-ocid={`planets.row.${i + 1}`}
                            className="text-xs hover:bg-accent/30"
                          >
                            <TableCell className="font-semibold">
                              {p.name}
                            </TableCell>
                            <TableCell>{p.signName}</TableCell>
                            <TableCell>{formatDeg(p.degrees)}</TableCell>
                            <TableCell>{p.nakshatra}</TableCell>
                            <TableCell>{p.pada}</TableCell>
                            <TableCell>{p.nakshatraLord}</TableCell>
                            <TableCell>{p.subLord}</TableCell>
                            <TableCell>{p.natalHouse}</TableCell>
                            <TableCell>{p.bhavaHouse}</TableCell>
                            <TableCell>{p.retrograde ? "R" : ""}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* House Cusps */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">House Cusps</span>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs">House</TableHead>
                          <TableHead className="text-xs">Sign</TableHead>
                          <TableHead className="text-xs">Degree</TableHead>
                          <TableHead className="text-xs">Nakshatra</TableHead>
                          <TableHead className="text-xs">Pada</TableHead>
                          <TableHead className="text-xs">Nak Lord</TableHead>
                          <TableHead className="text-xs">Sub Lord</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.cusps.map((c, i) => (
                          <TableRow
                            key={c.house}
                            data-ocid={`cusps.row.${i + 1}`}
                            className="text-xs hover:bg-accent/30"
                          >
                            <TableCell className="font-semibold">
                              H{c.house} {SIGN_ABBR[c.sign]}
                            </TableCell>
                            <TableCell>{c.signName}</TableCell>
                            <TableCell>{formatDeg(c.degrees)}</TableCell>
                            <TableCell>{c.nakshatra}</TableCell>
                            <TableCell>{c.pada}</TableCell>
                            <TableCell>{c.nakshatraLord}</TableCell>
                            <TableCell>{c.subLord}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-4 text-primary/30" />
                <p className="font-medium">
                  Calculate a birth chart first to view planet and house details
                </p>
              </div>
            )}
          </TabsContent>

          {/* ====== TAB 3: TRANSIT ====== */}
          <TabsContent value="transit" className="space-y-5">
            {!result ? (
              <div
                data-ocid="transit.empty_state"
                className="text-center py-16 text-muted-foreground"
              >
                <Star className="w-12 h-12 mx-auto mb-4 text-primary/30" />
                <p className="font-medium">
                  Please calculate a birth chart first
                </p>
                <p className="text-sm mt-1">
                  Go to the Horoscope tab, enter birth details and calculate.
                </p>
              </div>
            ) : (
              <>
                {/* Transit date/time controls */}
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    Transit Date
                  </h3>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Date
                      </Label>
                      <Input
                        data-ocid="transit.input"
                        type="date"
                        value={transitDate}
                        onChange={(e) => setTransitDate(e.target.value)}
                        className="w-40"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Time
                      </Label>
                      <Input
                        data-ocid="transit.input"
                        type="time"
                        value={transitTime}
                        onChange={(e) => setTransitTime(e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <Button
                      data-ocid="transit.primary_button"
                      onClick={handleTransitCalculate}
                      disabled={isTransitCalc}
                      className="text-sm font-semibold"
                      style={{
                        background: "oklch(var(--primary))",
                        color: "oklch(var(--primary-foreground))",
                      }}
                    >
                      {isTransitCalc ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4 mr-2" />
                          Calculate Transit
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Transit planets will be placed in natal house structure
                    (birth location: {form.place})
                  </p>
                </div>

                {/* Charts side by side */}
                <div className="flex flex-col lg:flex-row gap-5">
                  {/* Natal Chart */}
                  <div className="lg:w-1/2 rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm text-foreground">
                        Natal Chart
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-amber-100 text-amber-800 border-amber-300"
                      >
                        {form.date}
                      </Badge>
                    </div>
                    <NorthIndianChart
                      planets={result.planets}
                      ascendant={result.ascendant}
                      cusps={result.cusps}
                      labelMode={labelMode}
                      mode="natal"
                    />
                  </div>

                  {/* Transit Chart */}
                  <div className="lg:w-1/2 rounded-xl border border-green-200 bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: "#006622" }}
                      >
                        Transit Chart
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-100 text-green-800 border-green-300"
                      >
                        {transitDate}
                      </Badge>
                    </div>
                    {transitPlanets ? (
                      <NorthIndianChart
                        planets={transitPlanets}
                        ascendant={result.ascendant}
                        cusps={result.cusps}
                        labelMode={labelMode}
                        mode="natal"
                        title={`Transit — ${transitDate} ${transitTime}`}
                      />
                    ) : (
                      <div
                        data-ocid="transit.empty_state"
                        className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                      >
                        <Star className="w-10 h-10 mb-3 text-primary/20" />
                        <p className="text-sm">
                          Select a date and click Calculate Transit
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transit planet table */}
                {transitPlanets && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">
                        Transit Planet Positions — {transitDate}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="text-xs">Planet</TableHead>
                            <TableHead className="text-xs">Sign</TableHead>
                            <TableHead className="text-xs">Degree</TableHead>
                            <TableHead className="text-xs">Nakshatra</TableHead>
                            <TableHead className="text-xs">Nak Lord</TableHead>
                            <TableHead className="text-xs">Sub Lord</TableHead>
                            <TableHead className="text-xs">Natal H</TableHead>
                            <TableHead className="text-xs">R</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transitPlanets.map((p, i) => (
                            <TableRow
                              key={p.name}
                              data-ocid={`transit.row.${i + 1}`}
                              className="text-xs hover:bg-accent/30"
                            >
                              <TableCell className="font-semibold">
                                {p.name}
                              </TableCell>
                              <TableCell>{p.signName}</TableCell>
                              <TableCell>{formatDeg(p.degrees)}</TableCell>
                              <TableCell>{p.nakshatra}</TableCell>
                              <TableCell>{p.nakshatraLord}</TableCell>
                              <TableCell>{p.subLord}</TableCell>
                              <TableCell>{p.natalHouse}</TableCell>
                              <TableCell>{p.retrograde ? "R" : ""}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-8 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with{" "}
        <span className="text-red-500">♥</span> using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors underline underline-offset-2"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
