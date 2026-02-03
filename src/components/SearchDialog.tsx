import { useEffect, useState } from "react";
import { searchAll } from "../api/search";
import { listTags } from "../api/tags";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { tagBadgeStyle } from "@/lib/tagColors";

const typeLabels = {
  all: "All",
  snippets: "Snippets",
  notes: "Notes",
  projects: "Projects",
} as const;

type SearchType = keyof typeof typeLabels;

type ResultItem = {
  type: "snippet" | "note" | "project";
  id: string;
  title: string;
  description?: string;
  tags?: string[];
};

export default function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<SearchType>("all");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ResultItem[]>([]);
  const [tagColorMap, setTagColorMap] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setQ("");
    setItems([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listTags()
      .then((res: any) => {
        const items = Array.isArray(res?.items) ? res.items : [];
        const nextMap: Record<string, string> = {};
        for (const tag of items) {
          if (tag?.name && tag?.color) nextMap[tag.name] = tag.color;
        }
        setTagColorMap(nextMap);
      })
      .catch((err) => console.error(err));
  }, [open]);

  const runSearch = async () => {
    if (!q.trim()) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res: any = await searchAll(q.trim(), type);
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handler = setTimeout(() => {
      runSearch();
    }, 250);
    return () => clearTimeout(handler);
  }, [q, type, open]);

  const goTo = (item: ResultItem) => {
    if (item.type === "snippet") navigate(`/snippets/${item.id}`);
    if (item.type === "note") navigate(`/notes/${item.id}`);
    if (item.type === "project") navigate(`/projects/${item.id}`);
    onOpenChange(false);
  };

  const goToTag = (item: ResultItem, tag: string) => {
    if (item.type === "snippet") navigate(`/snippets?tag=${encodeURIComponent(tag)}`);
    if (item.type === "note") navigate(`/notes?tag=${encodeURIComponent(tag)}`);
    if (item.type === "project") navigate(`/projects?tag=${encodeURIComponent(tag)}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Search snippets, notes, projects..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
            }}
          />
          <div className="flex flex-wrap gap-2">
            {(Object.keys(typeLabels) as SearchType[]).map((t) => (
              <Button
                key={t}
                variant={type === t ? "default" : "outline"}
                size="sm"
                onClick={() => setType(t)}
              >
                {typeLabels[t]}
              </Button>
            ))}
            <Button variant="secondary" size="sm" onClick={runSearch}>
              Refine search
            </Button>
          </div>
          {loading && <p className="text-sm text-muted-foreground">Searching...</p>}
          {!loading && items.length === 0 && q.trim() && (
            <p className="text-sm text-muted-foreground">No results</p>
          )}
          <div className="divide-y divide-border">
            {items.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => goTo(item)}
                className="w-full text-left py-3 hover:bg-muted/40 px-2 rounded"
              >
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {item.description || ""}
                </div>
                {Array.isArray(item.tags) && item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.slice(0, 5).map((tag) => {
                      const { className, style } = tagBadgeStyle(tag, tagColorMap[tag]);
                      return (
                      <button
                        key={tag}
                        type="button"
                        className={`text-[10px] px-2 py-0.5 border rounded-full ${className}`}
                        style={style}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          goToTag(item, tag);
                        }}
                      >
                        {tag}
                      </button>
                      );
                    })}
                  </div>
                )}
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">{item.type}</div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
