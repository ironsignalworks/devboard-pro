import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import call from "../api/client";
import { listNotes, updateNote } from "../api/notes";
import { listSnippets, updateSnippet } from "../api/snippets";
import { listTags } from "../api/tags";
import { tagBadgeStyle } from "@/lib/tagColors";
import { toast } from "@/components/ui/sonner";
import { EmptyState } from "@/components/EmptyState";
import { FolderKanban } from "lucide-react";

export default function ProjectEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [tags, setTags] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [assignedSnippets, setAssignedSnippets] = useState<any[]>([]);
  const [unassignedSnippets, setUnassignedSnippets] = useState<any[]>([]);
  const [assignedNotes, setAssignedNotes] = useState<any[]>([]);
  const [unassignedNotes, setUnassignedNotes] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [assignedSnippetQuery, setAssignedSnippetQuery] = useState("");
  const [unassignedSnippetQuery, setUnassignedSnippetQuery] = useState("");
  const [assignedNoteQuery, setAssignedNoteQuery] = useState("");
  const [unassignedNoteQuery, setUnassignedNoteQuery] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [tagColorMap, setTagColorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await call(`/api/projects/${id}`);
        if (cancelled) return;
        setProject(res);
        setTitle(res.title || "");
        setDescription(res.description || "");
        setStatus(res.status || "active");
        setPreferredLanguage(res.preferredLanguage || "");
        setTags(Array.isArray(res.tags) ? res.tags.join(", ") : "");
      } catch (err) {
        console.error(err);
        setError("Failed to load project");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const loadItems = async () => {
    if (!id) return;
    setLoadingItems(true);
    try {
      const [snippetsAssignedRes, snippetsUnassignedRes, notesAssignedRes, notesUnassignedRes] =
        await Promise.all([
          listSnippets({ page: 1, limit: 200, projectId: id }),
          listSnippets({ page: 1, limit: 200, projectId: "unassigned" }),
          listNotes({ page: 1, limit: 200, projectId: id }),
          listNotes({ page: 1, limit: 200, projectId: "unassigned" }),
        ]);

      setAssignedSnippets(Array.isArray(snippetsAssignedRes?.items) ? snippetsAssignedRes.items : []);
      setUnassignedSnippets(Array.isArray(snippetsUnassignedRes?.items) ? snippetsUnassignedRes.items : []);
      setAssignedNotes(Array.isArray(notesAssignedRes?.items) ? notesAssignedRes.items : []);
      setUnassignedNotes(Array.isArray(notesUnassignedRes?.items) ? notesUnassignedRes.items : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [id]);

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

  const addTag = (value: string) => {
    const existing = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (existing.includes(value)) return;
    const next = [...existing, value].join(", ");
    setTags(next);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await call(`/api/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          description,
          status,
          preferredLanguage: preferredLanguage || undefined,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });
      toast.success("Project updated");
      navigate("/projects");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (event: React.DragEvent, type: "snippet" | "note", itemId: string) => {
    event.dataTransfer.setData("text/plain", JSON.stringify({ type, itemId }));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (event: React.DragEvent, targetProjectId: string | null) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("text/plain");
    if (!payload) return;
    try {
      const data = JSON.parse(payload);
      if (!data?.itemId || !data?.type) return;
      if (data.type === "snippet") {
        await updateSnippet(data.itemId, { projectId: targetProjectId });
      } else if (data.type === "note") {
        await updateNote(data.itemId, { projectId: targetProjectId });
      }
      loadItems();
    } catch (err) {
      console.error(err);
      toast.error("Failed to move item");
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const snippetStats = useMemo(
    () => ({ assigned: assignedSnippets.length, unassigned: unassignedSnippets.length }),
    [assignedSnippets.length, unassignedSnippets.length]
  );

  const noteStats = useMemo(
    () => ({ assigned: assignedNotes.length, unassigned: unassignedNotes.length }),
    [assignedNotes.length, unassignedNotes.length]
  );

  const filteredAssignedSnippets = useMemo(() => {
    const term = assignedSnippetQuery.trim().toLowerCase();
    if (!term) return assignedSnippets;
    return assignedSnippets.filter((snippet) => {
      const title = String(snippet.title || "").toLowerCase();
      const desc = String(snippet.description || "").toLowerCase();
      const tags = Array.isArray(snippet.tags) ? snippet.tags.join(" ").toLowerCase() : "";
      return title.includes(term) || desc.includes(term) || tags.includes(term);
    });
  }, [assignedSnippets, assignedSnippetQuery]);

  const filteredUnassignedSnippets = useMemo(() => {
    const term = unassignedSnippetQuery.trim().toLowerCase();
    if (!term) return unassignedSnippets;
    return unassignedSnippets.filter((snippet) => {
      const title = String(snippet.title || "").toLowerCase();
      const desc = String(snippet.description || "").toLowerCase();
      const tags = Array.isArray(snippet.tags) ? snippet.tags.join(" ").toLowerCase() : "";
      return title.includes(term) || desc.includes(term) || tags.includes(term);
    });
  }, [unassignedSnippets, unassignedSnippetQuery]);

  const filteredAssignedNotes = useMemo(() => {
    const term = assignedNoteQuery.trim().toLowerCase();
    if (!term) return assignedNotes;
    return assignedNotes.filter((note) => {
      const title = String(note.title || "").toLowerCase();
      const content = String(note.content || "").toLowerCase();
      const tags = Array.isArray(note.tags) ? note.tags.join(" ").toLowerCase() : "";
      return title.includes(term) || content.includes(term) || tags.includes(term);
    });
  }, [assignedNotes, assignedNoteQuery]);

  const filteredUnassignedNotes = useMemo(() => {
    const term = unassignedNoteQuery.trim().toLowerCase();
    if (!term) return unassignedNotes;
    return unassignedNotes.filter((note) => {
      const title = String(note.title || "").toLowerCase();
      const content = String(note.content || "").toLowerCase();
      const tags = Array.isArray(note.tags) ? note.tags.join(" ").toLowerCase() : "";
      return title.includes(term) || content.includes(term) || tags.includes(term);
    });
  }, [unassignedNotes, unassignedNoteQuery]);

  if (loading) return <div className="p-4 sm:p-6 text-sm text-muted-foreground">Loading project...</div>;
  if (!project) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Project not found"
        description={error || "This project may have been deleted or you may not have access."}
        actionLabel="Back to projects"
        onAction={() => navigate("/projects")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:underline"
            onClick={() => navigate("/projects")}
          >
            Back to projects
          </button>
          <h1 className="text-2xl font-bold mt-2">{project.title}</h1>
          <p className="text-sm text-muted-foreground">Organize notes and snippets inside this project.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{status}</Badge>
          <Button variant="outline" onClick={loadItems}>
            Refresh items
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="snippets">Snippets</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="p-4">
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block mb-1">Title</label>
                <input
                  className="border p-2 w-full"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1">Description</label>
                <textarea
                  className="border p-2 w-full min-h-[120px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1">Status</label>
                <select
                  className="border p-2 w-full"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Preferred snippet language</label>
                <select
                  className="border p-2 w-full"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                >
                  <option value="">None</option>
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="css">CSS</option>
                  <option value="sql">SQL</option>
                  <option value="bash">Bash</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Tags</label>
                <input
                  className="border p-2 w-full"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="comma, separated, tags"
                />
              </div>
              {tagSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tagSuggestions.slice(0, 10).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="text-xs border rounded px-2 py-1 hover:bg-muted"
                      onClick={() => addTag(tag)}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button className="px-3 py-1 bg-primary text-white rounded w-full sm:w-auto" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/projects")}
                  className="px-3 py-1 border rounded w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="snippets">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              className="p-4 space-y-3"
              onDrop={(event) => handleDrop(event, id || null)}
              onDragOver={handleDragOver}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Assigned snippets</h2>
                <Badge variant="secondary">{snippetStats.assigned}</Badge>
              </div>
              <input
                className="border p-2 w-full"
                value={assignedSnippetQuery}
                onChange={(event) => setAssignedSnippetQuery(event.target.value)}
                placeholder="Search assigned snippets"
              />
              {filteredAssignedSnippets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Drag snippets here to assign them.</p>
              ) : (
                <div className="space-y-2">
                  {filteredAssignedSnippets.map((snippet) => (
                    <div
                      key={snippet._id}
                      className="flex items-center justify-between gap-3 border rounded px-3 py-2"
                      draggable
                      onDragStart={(event) => handleDragStart(event, "snippet", snippet._id)}
                    >
                      <div>
                        <p className="font-medium text-sm">{snippet.title}</p>
                        <div className="flex flex-wrap gap-1">
                          {(snippet.tags || []).slice(0, 3).map((tag: string) => {
                            const { className, style } = tagBadgeStyle(tag, tagColorMap[tag]);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  navigate(`/snippets?tag=${encodeURIComponent(tag)}`);
                                }}
                              >
                                <Badge className={`text-xs ${className}`} style={style}>
                                  {tag}
                                </Badge>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/snippets/${snippet._id}`)}>
                        Open
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card
              className="p-4 space-y-3"
              onDrop={(event) => handleDrop(event, null)}
              onDragOver={handleDragOver}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Unassigned snippets</h2>
                <Badge variant="secondary">{snippetStats.unassigned}</Badge>
              </div>
              <input
                className="border p-2 w-full"
                value={unassignedSnippetQuery}
                onChange={(event) => setUnassignedSnippetQuery(event.target.value)}
                placeholder="Search unassigned snippets"
              />
              {filteredUnassignedSnippets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Everything is assigned. Drag here to unassign.</p>
              ) : (
                <div className="space-y-2">
                  {filteredUnassignedSnippets.map((snippet) => (
                    <div
                      key={snippet._id}
                      className="flex items-center justify-between gap-3 border rounded px-3 py-2"
                      draggable
                      onDragStart={(event) => handleDragStart(event, "snippet", snippet._id)}
                    >
                      <div>
                        <p className="font-medium text-sm">{snippet.title}</p>
                        <div className="flex flex-wrap gap-1">
                          {(snippet.tags || []).slice(0, 3).map((tag: string) => {
                            const { className, style } = tagBadgeStyle(tag, tagColorMap[tag]);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  navigate(`/snippets?tag=${encodeURIComponent(tag)}`);
                                }}
                              >
                                <Badge className={`text-xs ${className}`} style={style}>
                                  {tag}
                                </Badge>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/snippets/${snippet._id}`)}>
                        Open
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              className="p-4 space-y-3"
              onDrop={(event) => handleDrop(event, id || null)}
              onDragOver={handleDragOver}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Assigned notes</h2>
                <Badge variant="secondary">{noteStats.assigned}</Badge>
              </div>
              <input
                className="border p-2 w-full"
                value={assignedNoteQuery}
                onChange={(event) => setAssignedNoteQuery(event.target.value)}
                placeholder="Search assigned notes"
              />
              {filteredAssignedNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Drag notes here to assign them.</p>
              ) : (
                <div className="space-y-2">
                  {filteredAssignedNotes.map((note) => (
                    <div
                      key={note._id}
                      className="flex items-center justify-between gap-3 border rounded px-3 py-2"
                      draggable
                      onDragStart={(event) => handleDragStart(event, "note", note._id)}
                    >
                      <div>
                        <p className="font-medium text-sm">{note.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{note.content || ""}</p>
                        <div className="flex flex-wrap gap-1">
                          {(note.tags || []).slice(0, 3).map((tag: string) => {
                            const { className, style } = tagBadgeStyle(tag, tagColorMap[tag]);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  navigate(`/notes?tag=${encodeURIComponent(tag)}`);
                                }}
                              >
                                <Badge className={`text-xs ${className}`} style={style}>
                                  {tag}
                                </Badge>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/notes/${note._id}`)}>
                        Open
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card
              className="p-4 space-y-3"
              onDrop={(event) => handleDrop(event, null)}
              onDragOver={handleDragOver}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Unassigned notes</h2>
                <Badge variant="secondary">{noteStats.unassigned}</Badge>
              </div>
              <input
                className="border p-2 w-full"
                value={unassignedNoteQuery}
                onChange={(event) => setUnassignedNoteQuery(event.target.value)}
                placeholder="Search unassigned notes"
              />
              {filteredUnassignedNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Everything is assigned. Drag here to unassign.</p>
              ) : (
                <div className="space-y-2">
                  {filteredUnassignedNotes.map((note) => (
                    <div
                      key={note._id}
                      className="flex items-center justify-between gap-3 border rounded px-3 py-2"
                      draggable
                      onDragStart={(event) => handleDragStart(event, "note", note._id)}
                    >
                      <div>
                        <p className="font-medium text-sm">{note.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{note.content || ""}</p>
                        <div className="flex flex-wrap gap-1">
                          {(note.tags || []).slice(0, 3).map((tag: string) => {
                            const { className, style } = tagBadgeStyle(tag, tagColorMap[tag]);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  navigate(`/notes?tag=${encodeURIComponent(tag)}`);
                                }}
                              >
                                <Badge className={`text-xs ${className}`} style={style}>
                                  {tag}
                                </Badge>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/notes/${note._id}`)}>
                        Open
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {loadingItems && (
            <p className="text-sm text-muted-foreground">Updating lists...</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
