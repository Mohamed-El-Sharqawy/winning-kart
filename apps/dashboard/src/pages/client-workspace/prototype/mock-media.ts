const PALETTES: [string, string][] = [
  ["#f6d365", "#fda085"],
  ["#a1c4fd", "#c2e9fb"],
  ["#d4fc79", "#96e6a1"],
  ["#fbc2eb", "#a6c1ee"],
  ["#fdcbf2", "#e6dee9"],
  ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#30cfd0", "#330867"],
];

const VIDEOS = [
  "https://mdn.github.io/shared-assets/videos/flower.mp4",
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
];

export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function svgThumb(seed: string, width: number, height: number): string {
  const [from, to] = PALETTES[hashSeed(seed) % PALETTES.length] ?? PALETTES[0];
  const cx = 40 + (hashSeed(`${seed}x`) % Math.max(40, width - 80));
  const cy = 60 + (hashSeed(`${seed}y`) % Math.max(40, height - 120));
  const radius = 40 + (hashSeed(`${seed}r`) % 90);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs><rect width='${width}' height='${height}' fill='url(#g)'/><circle cx='${cx}' cy='${cy}' r='${radius}' fill='rgba(255,255,255,0.4)'/><circle cx='${(cx + 140) % width}' cy='${(cy + 90) % height}' r='${Math.round(radius / 2)}' fill='rgba(255,255,255,0.25)'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function videoSource(seed: string): string {
  return VIDEOS[hashSeed(`${seed}v`) % VIDEOS.length] ?? VIDEOS[0];
}

export function videoFallback(current: string): string | null {
  const index = VIDEOS.indexOf(current);
  if (index < 0 || index === VIDEOS.length - 1) return null;
  return VIDEOS[index + 1] ?? null;
}
