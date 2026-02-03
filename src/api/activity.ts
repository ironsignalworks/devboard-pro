import call from "./client";

export const listActivity = (limit = 20) =>
  call(`/api/activity?limit=${encodeURIComponent(String(limit))}`);
