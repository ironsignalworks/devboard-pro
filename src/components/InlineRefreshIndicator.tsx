import { Loader2 } from "lucide-react";

type InlineRefreshIndicatorProps = {
  label?: string;
};

export default function InlineRefreshIndicator({
  label = "Refreshing...",
}: InlineRefreshIndicatorProps) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
