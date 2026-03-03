const DEV_MODE = process.env.NODE_ENV !== "production";

export const getJwtSecret = () => process.env.JWT_SECRET || "changeme";

export const assertSecurityConfig = () => {
  const jwt = getJwtSecret();
  if (!DEV_MODE && (!jwt || jwt === "changeme" || jwt.length < 16)) {
    throw new Error("Invalid JWT_SECRET. Set a strong secret in production.");
  }
};

export const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
