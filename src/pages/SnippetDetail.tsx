import { ArrowLeft, Copy, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CodeEditor from "../components/CodeEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { deleteSnippet, getSnippet, updateSnippet } from "../api/snippets";
import { listProjects } from "../api/projects";
import { listTags } from "../api/tags";
import { toast } from "@/components/ui/sonner";
import ConfirmDialog from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Code2 } from "lucide-react";

export default function SnippetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [snippet, setSnippet] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const languageValue = language || "auto";
  const [tags, setTags] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [projectId, setProjectId] = useState("unassigned");
  const [projects, setProjects] = useState<any[]>([]);

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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getSnippet(id);
        if (cancelled) return;
        setSnippet(res);
        setTitle(res.title || "");
        setDescription(res.description || "");
        setLanguage(res.language || undefined);
        setTags(Array.isArray(res.tags) ? res.tags.join(", ") : "");
        setCode(res.code || "");
        setProjectId(res.projectId ? String(res.projectId) : "unassigned");
      } catch (err) {
        console.error(err);
        setError("Failed to load snippet");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    listTags()
      .then((res: any) => {
        const items = Array.isArray(res?.items) ? res.items : [];
        setTagSuggestions(items.map((t: any) => t.name).filter(Boolean));
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

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      await updateSnippet(id, {
        title,
        description,
        language,
        tags: parseTags(tags),
        code,
        projectId: projectId === "unassigned" ? null : projectId,
      });
      toast.success("Snippet updated");
      navigate("/snippets");
    } catch (err) {
      console.error(err);
      setError("Failed to save snippet");
      toast.error("Failed to save snippet");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteSnippet(id);
      toast.success("Snippet deleted");
      navigate("/snippets");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete snippet");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code || "");
    } catch (err) {
      console.error(err);
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

  if (loading) {
    return <div className="p-4 sm:p-6 text-sm text-muted-foreground">Loading snippet...</div>;
  }
  if (!snippet) {
    return (
      <EmptyState
        icon={Code2}
        title="Snippet not found"
        description={error || "This snippet may have been deleted or you may not have access."}
        actionLabel="Back to snippets"
        onAction={() => navigate("/snippets")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/snippets")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Snippet</h1>
            <p className="text-sm text-muted-foreground">
              Last updated {snippet.updatedAt ? new Date(snippet.updatedAt).toLocaleString() : "—"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter snippet title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a brief description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={languageValue}
                onValueChange={(v) => setLanguage(v === "auto" ? undefined : v)}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                  <SelectItem value="bash">Bash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="comma, separated, tags"
              />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <Label>Code</Label>
          </div>
          <CodeEditor value={code} onChange={setCode} language={language || snippet?.language} />
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete snippet?"
        description="This action cannot be undone."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
    </div>
  );
}
