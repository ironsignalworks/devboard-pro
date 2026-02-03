import call from "./client";

export const getProductivity = (days = 7) =>
  call(`/api/analytics/productivity?days=${encodeURIComponent(String(days))}`);
