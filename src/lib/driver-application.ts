import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const vehicleTypes = [
  { value: "water_tanker", label: "Water Tanker" },
  { value: "mini_tanker", label: "Mini Tanker" },
  { value: "large_tanker", label: "Large Tanker" },
  { value: "other", label: "Other" },
] as const;

export const DriverApplicationSchema = z.object({
  full_name: z.string().trim().min(3, "Enter full name").max(80),
  mobile: z.string().regex(/^\d{10}$/, "10-digit mobile required"),
  email: z.string().trim().email("Valid email required").max(160),
  address: z.string().trim().min(10, "Full address required").max(400),
  vehicle_number: z
    .string()
    .trim()
    .min(6, "Vehicle number required")
    .max(20)
    .regex(/^[A-Z0-9 -]+$/i, "Letters / numbers only"),
  vehicle_type: z.enum(["water_tanker", "mini_tanker", "large_tanker", "other"]),
  aadhaar_number: z.string().regex(/^\d{12}$/, "12-digit Aadhaar required"),
  pan_number: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/i, "Invalid PAN format"),
  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Driver Terms & Policies" }),
  }),
});

export type DriverApplicationInput = z.infer<typeof DriverApplicationSchema>;

export const DOC_FIELDS = [
  { key: "aadhaar", label: "Aadhaar Card", col: "aadhaar_url" },
  { key: "pan", label: "PAN Card", col: "pan_url" },
  { key: "dl", label: "Driving License", col: "dl_url" },
  { key: "rc", label: "Vehicle RC", col: "rc_url" },
] as const;

export type DocKey = (typeof DOC_FIELDS)[number]["key"];

export async function uploadDriverDoc(userId: string, key: DocKey, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${key}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("driver-docs")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  return path;
}

export async function getSignedDocUrl(path: string, seconds = 600) {
  const { data, error } = await supabase.storage
    .from("driver-docs")
    .createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}

export const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
  suspended: "bg-slate-200 text-slate-800 border-slate-300",
};
