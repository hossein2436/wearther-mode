export type Slot = 'top' | 'mid' | 'outer' | 'bottom' | 'onepiece' | 'shoes';

export type GarmentKind =
  | 'tshirt' | 'longsleeve' | 'shirt' | 'knit' | 'hoodie' | 'cardigan'
  | 'trench' | 'puffer' | 'blazer' | 'raincoat'
  | 'jeans' | 'chinos' | 'shorts' | 'skirt'
  | 'dress'
  | 'sneakers' | 'boots' | 'loafers' | 'sandals';

export type Pattern = 'solid' | 'stripes' | 'check' | 'print';

export type ItemStatus = 'available' | 'wash' | 'stored';

export interface Item {
  id: string;
  name: string;
  slot: Slot;
  kind: GarmentKind;
  /** Primary colour as hex. */
  color: string;
  colorName: string;
  /** 1 (very light) – 5 (very warm). */
  warmth: number;
  /** 1 (very casual) – 5 (very formal). */
  formality: number;
  waterproof?: boolean;
  keepOutOfRain?: boolean;
  /** Optional; plain when unset. */
  pattern?: Pattern;
  status: ItemStatus;
  wearCount: number;
  /** ISO date of last wear. */
  lastWorn?: string;
  /** Object URL or data URL of the user's own cutout photo. */
  photo?: string;
  /** True once the photo is backed up to the server. */
  photoSynced?: boolean;
  addedAt: string;
}

export interface HourForecast {
  hour: number; // 0–23 local
  tempC: number;
  feelsC: number;
  precipProb: number; // 0–100
  windKmh: number;
  uv: number;
}

export interface Forecast {
  place: string;
  /** ISO timestamp when fetched. */
  fetchedAt: string;
  hours: HourForecast[];
}

export interface DayWindow {
  leave: number; // hour
  back: number; // hour
}

export type Thermal = 'cold' | 'neutral' | 'warm';

export interface WindowSummary {
  hours: HourForecast[];
  minFeels: number;
  maxFeels: number;
  coldestHour: number;
  warmestHour: number;
  rainFrom: number | null;
  rainTo: number | null;
  maxRainProb: number;
  maxWind: number;
  maxUv: number;
}

export interface Outfit {
  items: Item[];
  score: number;
  why: string;
  /** Hours (inclusive) the removable outer layer is needed. */
  layerHours: [number, number] | null;
  notes: string[];
  /** Up to two short reasons the pieces go together (style engine). */
  style: string[];
  /** Anonymous look features, for learning taste. */
  features: string[];
}
