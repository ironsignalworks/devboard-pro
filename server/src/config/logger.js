const isProd = process.env.NODE_ENV === "production";

const format = (level, message, meta = {}) => {
  if (isProd) {
    return JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }
  return `[${level}] ${message}${Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ""}`;
};

export const logInfo = (message, meta = {}) => {
  console.log(format("info", message, meta));
};

export const logWarn = (message, meta = {}) => {
  console.warn(format("warn", message, meta));
};

export const logError = (message, error, meta = {}) => {
  const details = {
    ...meta,
    error: error?.message || String(error || ""),
  };
  console.error(format("error", message, details));
};
