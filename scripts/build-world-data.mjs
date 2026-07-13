/**
 * One-shot asset generator: Natural Earth 110m country boundaries
 * (world-atlas topojson) -> public/data/world-lines.json
 *
 * Output shape: { "lines": [ [ [lon, lat], ... ], ... ] } — an array of
 * polylines (country borders + coastlines, deduplicated by topojson mesh),
 * coordinates rounded to 2 decimals to keep the asset small.
 *
 * Usage:
 *   node scripts/build-world-data.mjs              # downloads the source
 *   node scripts/build-world-data.mjs <local.json> # uses a local topojson
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as topojson from "topojson-client";

const SOURCE_URL = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";
const OUT = "public/data/world-lines.json";

async function loadTopology() {
  const localPath = process.argv[2];
  if (localPath) {
    return JSON.parse(await readFile(localPath, "utf8"));
  }
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  return res.json();
}

const topology = await loadTopology();
const mesh = topojson.mesh(topology, topology.objects.countries);

const round = (n) => Math.round(n * 100) / 100;
const lines = mesh.coordinates.map((line) =>
  line.map(([lon, lat]) => [round(lon), round(lat)]),
);

await mkdir("public/data", { recursive: true });
await writeFile(OUT, JSON.stringify({ lines }));

const points = lines.reduce((acc, l) => acc + l.length, 0);
console.log(`wrote ${OUT}: ${lines.length} polylines, ${points} points`);
