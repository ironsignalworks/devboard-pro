import { Tag, Edit2, Trash2, RefreshCcw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { useEffect, useMemo, useState } from "react";
import { createTag, deleteTag, listTags, renameTag } from "../api/tags";
import { useNavigate } from "react-router-dom";
import { colorClassForTag } from "@/lib/tagColors";
import { toast } from "@/components/ui/sonner";
import ConfirmDialog from "@/components/ConfirmDialog";

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

const colorForTag = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 100000;
  }
  return colorClasses[hash % colorClasses.length];
};

export default function Tags() {
  const [tags, setTags] = useState<{ name: string; count: number; color?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [deletePendingTag, setDeletePendingTag] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listTags();
      setTags(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    setError(null);
    const name = newTag.trim();
    try {
      const res: any = await createTag({ name, color: colorClassForTag(name) });
      if (res?.message && !res?.name) {
        setError(res.message);
        toast.error(res.message);
        return;
      }
      setNewTag("");
      toast.success("Tag created");
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create tag");
    }
  };

  const handleRename = async (name: string) => {
    const next = prompt("Rename tag", name);
    if (!next || next === name) return;
    try {
      await renameTag(name, next.trim());
      toast.success("Tag renamed");
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to rename tag");
    }
  };

  const handleDelete = async () => {
    if (!deletePendingTag) return;
    try {
      await deleteTag(deletePendingTag);
      toast.success("Tag deleted");
      setDeletePendingTag(null);
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete tag");
    }
  };

  const list = useMemo(
    () =>
      tags.map((tag) => ({
        ...tag,
        color: tag.color || colorForTag(tag.name),
      })),
    [tags]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Tags</h1>
          <p className="text-muted-foreground">
            Tags are generated from your snippets and notes. Create, rename, or delete to keep things tidy.
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="border p-2 rounded w-full sm:w-56"
          placeholder="New tag name"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
        />
        <Button type="submit" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create tag
        </Button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? <p className="text-sm text-muted-foreground">Loading tags...</p> : null}

      {list.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {list.map((tag) => (
            <Card
              key={tag.name}
              className="inline-flex w-auto transition-all hover:shadow-md hover:border-primary/20"
            >
              <CardContent className="p-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${tag.color}`} />
                    <span className="text-sm font-medium">{tag.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {tag.count}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => navigate(`/notes?tag=${encodeURIComponent(tag.name)}`)}
                    >
                      Notes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => navigate(`/snippets?tag=${encodeURIComponent(tag.name)}`)}
                    >
                      Snippets
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => navigate(`/projects?tag=${encodeURIComponent(tag.name)}`)}
                    >
                      Projects
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRename(tag.name)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeletePendingTag(tag.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Tag}
          title="No tags yet"
          description="Add tags to notes or snippets to see them here."
        />
      )}

      <ConfirmDialog
        open={Boolean(deletePendingTag)}
        onOpenChange={(open) => {
          if (!open) setDeletePendingTag(null);
        }}
        title="Delete tag?"
        description="This will remove the tag from all items that reference it."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
