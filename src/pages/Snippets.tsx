import { useEffect, useMemo, useState } from "react";
import { Code2, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createSnippet, deleteSnippet, listSnippets } from "../api/snippets";
import { listProjects } from "../api/projects";
import { listTags } from "../api/tags";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { tagBadgeStyle } from "@/lib/tagColors";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "@/components/ui/sonner";
import ListSkeleton from "@/components/ListSkeleton";

export default function Snippets() {
  const [snippets, setSnippets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [sort, setSort] = useState("recent");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [tags, setTags] = useState("");
  const [code, setCode] = useState("");
  const [projectId, setProjectId] = useState("unassigned");
  const [projects, setProjects] = useState<any[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [viewSnippet, setViewSnippet] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [tagColorMap, setTagColorMap] = useState<Record<string, string>>({});
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const parseTags = (raw: string) =>
    raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

  const keywordSuggestions = (text: string) => {
    const stop = new Set([
      "the","and","for","with","that","this","from","into","your","you","are","was","were","have","has","had","but","not","all","any","can","will","just","its","our","their","than","then","when","what","why","how","who","which","while","where","about","also","use","using","used","over","under","new","old","add","edit","remove","create","update","delete","note","snippet","project","code"
    ]);
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9_\-\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 3 && !stop.has(word));
    const unique: string[] = [];
    for (const word of words) {
      if (!unique.includes(word)) unique.push(word);
      if (unique.length >= 6) break;
    }
    return unique;
  };

  const formatUpdatedAt = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  };

  const load = async (overrideTag?: string) => {
    setLoading(true);
    setError(null);
    try {
      const activeTag = overrideTag !== undefined ? overrideTag : tag;
      const res = await listSnippets({
        page: 1,
        limit: 100,
        q: q.trim() || undefined,
        tag: activeTag.trim() || undefined,
      });
      setSnippets(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load snippets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const tagParam = searchParams.get("tag") || "";
    if (tagParam && tagParam !== tag) {
      setTag(tagParam);
      load(tagParam);
    }
  }, [searchParams]);

  useEffect(() => {
    listTags()
      .then((res: any) => {
        const items = Array.isArray(res?.items) ? res.items : [];
        setTagSuggestions(items.map((t: any) => t.name).filter(Boolean));
        const nextMap: Record<string, string> = {};
        for (const tag of items) {
          if (tag?.name && tag?.color) nextMap[tag.name] = tag.color;
        }
        setTagColorMap(nextMap);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    listProjects({ page: 1, limit: 100 })
      .then((res: any) => {
        const items = Array.isArray(res?.items) ? res.items : [];
        setProjects(items);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (projectId === "unassigned") return;
    const selected = projects.find((project) => project._id === projectId);
    if (selected?.preferredLanguage && !language) {
      setLanguage(String(selected.preferredLanguage));
    }
  }, [projectId, projects, language]);

  const selectedProject = projects.find((project) => project._id === projectId);

  const suggestedTags = useMemo(() => {
    const existing = new Set(parseTags(tags).map((t) => t.toLowerCase()));
    const projectTags = Array.isArray(selectedProject?.tags) ? selectedProject.tags : [];
    const keywords = keywordSuggestions(`${title} ${description} ${code}`);
    const candidates = [
      ...(selectedProject?.preferredLanguage ? [String(selectedProject.preferredLanguage).toLowerCase()] : []),
      ...projectTags,
      ...keywords,
      ...tagSuggestions,
    ];
    const unique: string[] = [];
    const seen = new Set<string>();
    for (const candidate of candidates) {
      const clean = String(candidate || "").trim();
      if (!clean) continue;
      const norm = clean.toLowerCase();
      if (existing.has(norm) || seen.has(norm)) continue;
      seen.add(norm);
      unique.push(clean);
      if (unique.length >= 10) break;
    }
    return unique;
  }, [title, description, code, tags, tagSuggestions, selectedProject]);

  const filtered = useMemo(() => {
    let items = [...snippets];
    if (languageFilter !== "all") {
      items = items.filter(
        (s) => (s.language || "").toLowerCase() === languageFilter
      );
    }
    if (sort === "alphabetical") {
      items.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
    } else if (sort === "oldest") {
      items.sort(
        (a, b) =>
          new Date(a.updatedAt || 0).getTime() -
          new Date(b.updatedAt || 0).getTime()
      );
    } else {
      items.sort(
        (a, b) =>
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime()
      );
    }
    return items;
  }, [snippets, languageFilter, sort]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createSnippet({
        title: title.trim(),
        description,
        code: code || "",
        language: language || undefined,
        tags: parseTags(tags),
        projectId: projectId === "unassigned" ? null : projectId,
      });
      setTitle("");
      setDescription("");
      setLanguage("");
      setTags("");
      setCode("");
      setProjectId("unassigned");
      toast.success("Snippet created");
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create snippet");
    }
  };

  const addTag = (value: string) => {
    const existing = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (existing.includes(value)) return;
    const next = [...existing, value].join(", ");
    setTags(next);
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteSnippet(confirmDeleteId);
      toast.success("Snippet deleted");
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete snippet");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Snippets</h1>
          <p className="text-muted-foreground">
            Manage and organize your code snippets
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Create</Button>
      </div>

      

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="border p-2 w-full sm:w-[220px]"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search snippets"
          />
          <input
            className="border p-2 w-full sm:w-[180px]"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Filter by tag"
          />
          <Button variant="outline" onClick={load}>
            Search
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="css">CSS</SelectItem>
              <SelectItem value="sql">SQL</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <ListSkeleton rows={4} />
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((snippet) => (
            <Card key={snippet._id}>
              <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4">
                <div className="flex items-start gap-3 md:flex-1">
                  <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm line-clamp-1">
                        {snippet.title}
                      </h3>
                      {snippet.language && (
                        <Badge variant="secondary" className="text-xs">
                          {snippet.language}
                        </Badge>
                      )}
                    </div>
                    {snippet.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {snippet.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {(snippet.tags || []).map((t: string) => {
                        const { className, style } = tagBadgeStyle(t, tagColorMap[t]);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => navigate(`/snippets?tag=${encodeURIComponent(t)}`)}
                          >
                            <Badge className={`text-xs ${className}`} style={style}>
                              {t}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:gap-2">
                  <div className="text-xs text-muted-foreground">
                    {formatUpdatedAt(snippet.updatedAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewSnippet(snippet)}
                      className="px-3 py-1 border rounded"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/snippets/${snippet._id}`)}
                      className="px-3 py-1 border rounded"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(snippet._id)}
                      className="px-3 py-1 border rounded text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Code2}
          title="No snippets yet"
          description="Create your first code snippet to get started organizing your development knowledge."
          actionLabel="Create Snippet"
          onAction={() => setCreateOpen(true)}
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Snippet</DialogTitle>
            <DialogDescription>Add your snippet details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              ref={titleInputRef}
              className="border p-2 w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Snippet title"
            />
            <textarea
              className="border p-2 w-full min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="border p-2 w-full"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Language (e.g. typescript)"
              />
              <input
                className="border p-2 w-full"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma separated)"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm text-muted-foreground">Project</label>
              <select
                className="border p-2 w-full"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="unassigned">Unassigned</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
            {suggestedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((t) => (
                  <button
                    type="button"
                    key={t}
                    className="text-xs border rounded px-2 py-1 hover:bg-muted"
                    onClick={() => addTag(t)}
                  >
                    + {t}
                  </button>
                ))}
              </div>
            )}
            <textarea
              className="border p-2 w-full min-h-[120px] font-mono text-sm"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code snippet"
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewSnippet} onOpenChange={() => setViewSnippet(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewSnippet?.title}</DialogTitle>
            <DialogDescription>{formatUpdatedAt(viewSnippet?.updatedAt)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
            <p className="text-sm text-muted-foreground">{viewSnippet?.description || ""}</p>
            {viewSnippet?.code && (
              <pre className="max-h-64 overflow-auto"><code>{viewSnippet.code}</code></pre>
            )}
            <div className="flex flex-wrap gap-1">
              {(viewSnippet?.tags || []).map((t: string) => {
                const { className, style } = tagBadgeStyle(t, tagColorMap[t]);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => navigate(`/snippets?tag=${encodeURIComponent(t)}`)}
                  >
                    <Badge className={`text-xs ${className}`} style={style}>{t}</Badge>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const id = viewSnippet?._id
                  setViewSnippet(null)
                  if (id) navigate(`/snippets/${id}`)
                }}
                className="px-3 py-1 border rounded"
              >
                Edit
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
        title="Delete snippet?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
