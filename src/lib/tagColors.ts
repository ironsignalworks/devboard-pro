const colorClasses = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-rose-500",
];

import type { CSSProperties } from "react";

const isHexColor = (value: string) => /^#([0-9a-f]{3}){1,2}$/i.test(value);
const isRgbColor = (value: string) => value.startsWith("rgb(") || value.startsWith("rgba(");

export const colorClassForTag = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 100000;
  }
  return colorClasses[hash % colorClasses.length];
};

export const tagBadgeStyle = (name: string, color?: string) => {
  if (!color) {
    return {
      className: `${colorClassForTag(name)} text-white border-transparent`,
      style: undefined as CSSProperties | undefined,
    };
  }
  if (color.startsWith("bg-")) {
    return { className: `${color} text-white border-transparent`, style: undefined };
  }
  if (isHexColor(color) || isRgbColor(color)) {
    return { className: "text-white border-transparent", style: { backgroundColor: color } };
  }
  return { className: `${colorClassForTag(name)} text-white border-transparent`, style: undefined };
};
