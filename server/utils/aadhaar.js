const crypto = require("crypto");

const getEncKey = () => {
  const key = process.env.AADHAAR_ENC_KEY;
  if (!key) throw new Error("AADHAAR_ENC_KEY not configured");
  // Accept hex or base64; normalize to Buffer length 32
  if (/^[0-9a-fA-F]{64}$/.test(key)) return Buffer.from(key, "hex");
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) throw new Error("AADHAAR_ENC_KEY must be 32 bytes (base64 or hex)");
  return buf;
};

const getHmacKey = () => {
  const key = process.env.AADHAAR_HMAC_KEY;
  if (!key) throw new Error("AADHAAR_HMAC_KEY not configured");
  // allow any string; use as utf8
  return Buffer.from(key, "utf8");
};

exports.validateAadhaar = (num) => /^[0-9]{12}$/.test(String(num || "").trim());

exports.encryptAadhaar = (num) => {
  const key = getEncKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(String(num), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store as base64 iv.tag.ct
  return `${iv.toString("base64")}::${tag.toString("base64")}::${ciphertext.toString("base64")}`;
};

exports.decryptAadhaar = (payload) => {
  const key = getEncKey();
  const [ivB64, tagB64, ctB64] = String(payload || "").split("::");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("Invalid Aadhaar payload");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ct = Buffer.from(ctB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
};

exports.hashAadhaar = (num) => {
  const key = getHmacKey();
  return crypto.createHmac("sha256", key).update(String(num)).digest("hex");
};