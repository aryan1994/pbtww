// Order ID + WhatsApp helpers + canonical pricing
export const COMPANY = {
  name: "PAPPU BHAI TANKER WALE",
  short: "PBTW",
  phone: "9214775938",
  whatsapp: "919214775938",
  email: "pbtwgroup@gmail.com",
  instagram: "@pbtwgroup",
  address: "Gaddi Thoriyan Housing Board, Beawar, Rajasthan - 305901",
  origin: "Prabhu Ki Bagiya, Beawar, Rajasthan",
};

// Origin coordinates used to compute delivery distance
export const ORIGIN_COORDS = { lat: 26.098, lng: 74.3199 };

export type WaterType = "drinking" | "non-drinking" | "construction";
export type TankerSize = 1000 | 3000 | 5000 | 10000;

// Official PBTW pricing (₹) — base price by water type + size
export const PRICING: Record<WaterType, Record<TankerSize, number>> = {
  drinking: { 1000: 399, 3000: 899, 5000: 1399, 10000: 2499 },
  "non-drinking": { 1000: 99, 3000: 199, 5000: 299, 10000: 499 },
  construction: { 1000: 79, 3000: 169, 5000: 259, 10000: 449 },
};

export const WATER_TYPE_LABEL: Record<WaterType, string> = {
  drinking: "Drinking Water",
  "non-drinking": "Non-Drinking Water",
  construction: "Construction Water",
};

// Per-km delivery charge in ₹
export const DELIVERY_RATE_PER_KM = 59;
// Wallet payment discount %
export const WALLET_DISCOUNT_PCT = 15;

export function calcDeliveryCharge(km: number): number {
  return Math.max(0, Math.round(km * DELIVERY_RATE_PER_KM));
}

export function calcWalletDiscount(subtotal: number): number {
  return Math.round((subtotal * WALLET_DISCOUNT_PCT) / 100);
}

// Haversine great-circle distance in kilometres
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function generateOrderId(): string {
  const digits = () => Math.floor(1000 + Math.random() * 9000).toString();
  const letters = () => {
    const a = "ABCDEFGHJKMNPQRSTUVWXYZ";
    let s = "";
    for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  };
  return `PBTW-${digits()}${letters()}${Math.floor(100 + Math.random() * 900)}`;
}

export interface BookingPayload {
  orderId: string;
  name: string;
  phone: string;
  address: string;
  landmark?: string;
  size: TankerSize;
  waterType: WaterType;
  date: string;
  slot: string;
  payment: "cod" | "online" | "wallet";
  amount: number;
  distance?: number;
  deliveryCharge?: number;
  location?: { lat: number; lng: number };
}

export function buildWhatsAppLink(b: BookingPayload): string {
  const mapsLink = b.location
    ? `https://www.google.com/maps?q=${b.location.lat},${b.location.lng}`
    : "";
  const paymentLabel =
    b.payment === "cod"
      ? "Cash on Delivery"
      : b.payment === "wallet"
      ? "Wallet (15% off)"
      : "Online";
  const lines = [
    `I Need Your Service`,
    ``,
    `*Order ID:* ${b.orderId}`,
    `*Name:* ${b.name}`,
    `*Phone:* ${b.phone}`,
    `*Address:* ${b.address}${b.landmark ? ` (${b.landmark})` : ""}`,
    mapsLink ? `*Location:* ${mapsLink}` : ``,
    ``,
    `*Tanker:* ${b.size.toLocaleString()} L (${WATER_TYPE_LABEL[b.waterType]})`,
    b.distance ? `*Distance:* ~${b.distance.toFixed(1)} km` : ``,
    b.deliveryCharge ? `*Delivery:* ₹${b.deliveryCharge}` : ``,
    `*Delivery:* ${b.date} • ${b.slot}`,
    `*Payment:* ${paymentLabel}`,
    `*Total:* ₹${b.amount}`,
    ``,
    `— Booked via pbtw.lovable.app`,
  ].filter(Boolean);
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${COMPANY.whatsapp}?text=${text}`;
}

export const ORDER_STATUS_FLOW = [
  "pending",
  "confirmed",
  "assigned",
  "on_the_way",
  "reached",
  "delivered",
] as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Order placed",
  confirmed: "Order confirmed",
  assigned: "Driver assigned",
  on_the_way: "On the way",
  reached: "Reached location",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
