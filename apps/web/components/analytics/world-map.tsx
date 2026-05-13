"use client";

import * as React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { cn } from "@/lib/utils";

// CDN-hosted TopoJSON. Same dataset used by sink (`world-atlas` v2 110m).
// world-atlas features expose only `properties.name` and a numeric `id`
// (ISO 3166-1 numeric, e.g. "356" for India). They do NOT carry iso_a2,
// so we map our ISO Alpha-2 inputs to numeric for the lookup.
const WORLD_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ISO 3166-1 Alpha-2 → numeric. Stable, complete enough for cf.country values.
const ISO2_TO_NUMERIC: Record<string, string> = {
  AD: "020",
  AE: "784",
  AF: "004",
  AG: "028",
  AI: "660",
  AL: "008",
  AM: "051",
  AO: "024",
  AQ: "010",
  AR: "032",
  AS: "016",
  AT: "040",
  AU: "036",
  AW: "533",
  AX: "248",
  AZ: "031",
  BA: "070",
  BB: "052",
  BD: "050",
  BE: "056",
  BF: "854",
  BG: "100",
  BH: "048",
  BI: "108",
  BJ: "204",
  BL: "652",
  BM: "060",
  BN: "096",
  BO: "068",
  BQ: "535",
  BR: "076",
  BS: "044",
  BT: "064",
  BV: "074",
  BW: "072",
  BY: "112",
  BZ: "084",
  CA: "124",
  CC: "166",
  CD: "180",
  CF: "140",
  CG: "178",
  CH: "756",
  CI: "384",
  CK: "184",
  CL: "152",
  CM: "120",
  CN: "156",
  CO: "170",
  CR: "188",
  CU: "192",
  CV: "132",
  CW: "531",
  CX: "162",
  CY: "196",
  CZ: "203",
  DE: "276",
  DJ: "262",
  DK: "208",
  DM: "212",
  DO: "214",
  DZ: "012",
  EC: "218",
  EE: "233",
  EG: "818",
  EH: "732",
  ER: "232",
  ES: "724",
  ET: "231",
  FI: "246",
  FJ: "242",
  FK: "238",
  FM: "583",
  FO: "234",
  FR: "250",
  GA: "266",
  GB: "826",
  GD: "308",
  GE: "268",
  GF: "254",
  GG: "831",
  GH: "288",
  GI: "292",
  GL: "304",
  GM: "270",
  GN: "324",
  GP: "312",
  GQ: "226",
  GR: "300",
  GS: "239",
  GT: "320",
  GU: "316",
  GW: "624",
  GY: "328",
  HK: "344",
  HM: "334",
  HN: "340",
  HR: "191",
  HT: "332",
  HU: "348",
  ID: "360",
  IE: "372",
  IL: "376",
  IM: "833",
  IN: "356",
  IO: "086",
  IQ: "368",
  IR: "364",
  IS: "352",
  IT: "380",
  JE: "832",
  JM: "388",
  JO: "400",
  JP: "392",
  KE: "404",
  KG: "417",
  KH: "116",
  KI: "296",
  KM: "174",
  KN: "659",
  KP: "408",
  KR: "410",
  KW: "414",
  KY: "136",
  KZ: "398",
  LA: "418",
  LB: "422",
  LC: "662",
  LI: "438",
  LK: "144",
  LR: "430",
  LS: "426",
  LT: "440",
  LU: "442",
  LV: "428",
  LY: "434",
  MA: "504",
  MC: "492",
  MD: "498",
  ME: "499",
  MF: "663",
  MG: "450",
  MH: "584",
  MK: "807",
  ML: "466",
  MM: "104",
  MN: "496",
  MO: "446",
  MP: "580",
  MQ: "474",
  MR: "478",
  MS: "500",
  MT: "470",
  MU: "480",
  MV: "462",
  MW: "454",
  MX: "484",
  MY: "458",
  MZ: "508",
  NA: "516",
  NC: "540",
  NE: "562",
  NF: "574",
  NG: "566",
  NI: "558",
  NL: "528",
  NO: "578",
  NP: "524",
  NR: "520",
  NU: "570",
  NZ: "554",
  OM: "512",
  PA: "591",
  PE: "604",
  PF: "258",
  PG: "598",
  PH: "608",
  PK: "586",
  PL: "616",
  PM: "666",
  PN: "612",
  PR: "630",
  PS: "275",
  PT: "620",
  PW: "585",
  PY: "600",
  QA: "634",
  RE: "638",
  RO: "642",
  RS: "688",
  RU: "643",
  RW: "646",
  SA: "682",
  SB: "090",
  SC: "690",
  SD: "729",
  SE: "752",
  SG: "702",
  SH: "654",
  SI: "705",
  SJ: "744",
  SK: "703",
  SL: "694",
  SM: "674",
  SN: "686",
  SO: "706",
  SR: "740",
  SS: "728",
  ST: "678",
  SV: "222",
  SX: "534",
  SY: "760",
  SZ: "748",
  TC: "796",
  TD: "148",
  TF: "260",
  TG: "768",
  TH: "764",
  TJ: "762",
  TK: "772",
  TL: "626",
  TM: "795",
  TN: "788",
  TO: "776",
  TR: "792",
  TT: "780",
  TV: "798",
  TW: "158",
  TZ: "834",
  UA: "804",
  UG: "800",
  UM: "581",
  US: "840",
  UY: "858",
  UZ: "860",
  VA: "336",
  VC: "670",
  VE: "862",
  VG: "092",
  VI: "850",
  VN: "704",
  VU: "548",
  WF: "876",
  WS: "882",
  XK: "983",
  YE: "887",
  YT: "175",
  ZA: "710",
  ZM: "894",
  ZW: "716",
};

const NUMERIC_TO_ISO2: Record<string, string> = Object.fromEntries(
  Object.entries(ISO2_TO_NUMERIC).map(([iso2, num]) => [num, iso2])
);

export interface CountryDatum {
  /** ISO Alpha-2 (e.g. "US") OR full English country name (e.g. "United States"). */
  country: string;
  clicks: number;
}

interface WorldMapProps {
  data: CountryDatum[];
  className?: string;
  /** Heat-shade base color (CSS color). Defaults to brand coral. */
  fillColor?: string;
}

function countryToFlagEmoji(code: string): string {
  if (code.length !== 2) return "";
  const A = 0x1f1e6;
  const a = "A".charCodeAt(0);
  const u = code.toUpperCase();
  return (
    String.fromCodePoint(A + (u.charCodeAt(0) - a)) +
    String.fromCodePoint(A + (u.charCodeAt(1) - a))
  );
}

export function WorldMap({ data, className, fillColor = "oklch(0.62 0.22 25)" }: WorldMapProps) {
  const [tooltip, setTooltip] = React.useState<{
    x: number;
    y: number;
    name: string;
    flag: string;
    clicks: number;
  } | null>(null);

  const max = React.useMemo(() => Math.max(1, ...data.map((d) => d.clicks)), [data]);

  const colorScale = React.useMemo(
    () => scaleLinear<string>().domain([0, max]).range(["#e5e7eb", fillColor]),
    [max, fillColor]
  );

  // Build a lookup keyed by:
  //  - numeric ISO 3166-1 (matches world-atlas `geo.id`)
  //  - lowercase English name (matches world-atlas `geo.properties.name`)
  // Inputs may arrive as ISO Alpha-2 ("IN") or as full names ("India").
  const lookup = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data) {
      const raw = d.country?.trim() ?? "";
      if (!raw) continue;
      m.set(raw.toLowerCase(), d.clicks);
      if (raw.length === 2) {
        const numeric = ISO2_TO_NUMERIC[raw.toUpperCase()];
        if (numeric) m.set(numeric, d.clicks);
      }
    }
    return m;
  }, [data]);

  return (
    <div className={cn("relative w-full", className)}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 110 }}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={WORLD_TOPOJSON_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name: string = geo.properties.name ?? "";
              const numericId: string = typeof geo.id === "string" ? geo.id : String(geo.id ?? "");
              const lookupKeys = [numericId, name.toLowerCase()];
              const clicks = lookupKeys.map((k) => lookup.get(k) ?? 0).find((c) => c > 0) ?? 0;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={clicks > 0 ? colorScale(clicks) : "#f3f4f6"}
                  stroke="#fff"
                  strokeWidth={0.4}
                  onMouseEnter={(e) => {
                    const iso2 = NUMERIC_TO_ISO2[numericId];
                    setTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      name,
                      flag: iso2 ? countryToFlagEmoji(iso2) : "",
                      clicks,
                    });
                  }}
                  onMouseMove={(e) => {
                    setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t));
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", filter: "brightness(1.1)" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <div className="font-medium">
            {tooltip.flag} {tooltip.name || "Unknown"}
          </div>
          <div className="text-muted-foreground">
            {tooltip.clicks.toLocaleString()} {tooltip.clicks === 1 ? "click" : "clicks"}
          </div>
        </div>
      )}
    </div>
  );
}
