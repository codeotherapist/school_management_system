import crypto from "crypto";

const QR_SECRET = process.env.QR_SECRET || "dev-secret-change-me";

export type LessonQrPayload = {
  type: "lesson_attendance";
  lessonId: number;
  date: string; // "YYYY-MM-DD"
  exp: number;  // unix seconds
  nonce: string;
};

function base64url(input: Buffer | string) {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input: string) {
  const s = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(s, "base64").toString();
}

export function signLessonQr(payload: LessonQrPayload): string {
  const json = JSON.stringify(payload);
  const payloadB64 = base64url(json);
  const sig = crypto
    .createHmac("sha256", QR_SECRET)
    .update(payloadB64)
    .digest();
  const sigB64 = base64url(sig);
  return `${payloadB64}.${sigB64}`;
}

export function verifyLessonQr(qrString: string): LessonQrPayload {
  const [payloadB64, sigB64] = qrString.split(".");
  if (!payloadB64 || !sigB64) throw new Error("Invalid QR format");

  const expectedSig = crypto
    .createHmac("sha256", QR_SECRET)
    .update(payloadB64)
    .digest();
  const expectedSigB64 = base64url(expectedSig);

  const a = Buffer.from(sigB64);
  const b = Buffer.from(expectedSigB64);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("Invalid QR signature");
  }

  const jsonStr = base64urlDecode(payloadB64);
  const payload = JSON.parse(jsonStr) as LessonQrPayload;

  if (payload.type !== "lesson_attendance") {
    throw new Error("Invalid QR type");
  }

  return payload;
}
