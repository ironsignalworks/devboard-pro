import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { createNote, deleteNote, listNotes } from "../api/notes";
import { listProjects } from "../api/projects";
import { listTags } from "../api/tags";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { tagBadgeStyle } from "@/lib/tagColors";
import RichTextEditor from "@/components/RichTextEditor";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "@/components/ui/sonner";
import ListSkeleton from "@/components/ListSkeleton";

export default function Notes() {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(9)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [projectId, setProjectId] = useState('unassigned')
  const [projects, setProjects] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewNote, setViewNote] = useState<any | null>(null)
  const [searchParams] = useSearchParams()
  const [tagColorMap, setTagColorMap] = useState<Record<string, string>>({})
  const navigate = useNavigate()

  const parseTags = (raw: string) =>
    raw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

  const formatUpdatedAt = (value?: string) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString()
  }

  const load = async (p = 1, overrideTag?: string) => {
    setLoading(true)
    try {
      const activeTag = overrideTag !== undefined ? overrideTag : tagFilter
      const res = await listNotes({ page: p, limit, q: q.trim() || undefined, tag: activeTag.trim() || undefined })
      const items = Array.isArray(res) ? res : res?.items || []
      setNotes(items)
      setTotal(res?.total || 0)
      setPage(res?.page || p)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [])

  useEffect(() => {
    const tagParam = searchParams.get("tag") || ""
    if (tagParam && tagParam !== tagFilter) {
      setTagFilter(tagParam)
      load(1, tagParam)
    }
    if (searchParams.get("create") === "1") {
      setCreateOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    listProjects({ page: 1, limit: 100 })
      .then((res: any) => {
        const items = Array.isArray(res?.items) ? res.items : []
        setProjects(items)
      })
      .catch((err) => console.error(err))
  }, [])

  useEffect(() => {
    listTags()
      .then((res: any) => {
        const items = Array.isArray(res?.items) ? res.items : []
        const nextMap: Record<string, string> = {}
        for (const tag of items) {
          if (tag?.name && tag?.color) nextMap[tag.name] = tag.color
        }
        setTagColorMap(nextMap)
      })
      .catch((err) => console.error(err))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      const res: any = await createNote({
        title: title.trim(),
        content,
        tags: parseTags(tags),
        projectId: projectId === "unassigned" ? null : projectId,
      })
      if (res?.__error) throw new Error(res?.message || "Failed to create note")
      setTitle('')
      setContent('')
      setTags('')
      setProjectId('unassigned')
      setCreateOpen(false)
      toast.success("Note created")
      load(1)
    } catch (err) {
      console.error(err)
      toast.error("Failed to create note")
    }
  }

  const stripHtml = (value: string) =>
    value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    try {
      await deleteNote(confirmDeleteId)
      toast.success("Note deleted")
      load(page)
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete note")
    } finally {
      setConfirmDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Notes</h1>
          <p className="text-muted-foreground">
            Document your thoughts, ideas, and learnings
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Create</Button>
      </div>

      

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="border p-2 w-full sm:w-[220px]"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes"
        />
        <input
          className="border p-2 w-full sm:w-[180px]"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          placeholder="Filter by tag"
        />
        <Button variant="outline" onClick={() => load(1)}>
          Search
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setQ('')
            setTagFilter('')
            load(1)
          }}
        >
          Clear
        </Button>
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : notes.length > 0 ? (
        <div>
          <div className="space-y-3">
            {notes.map((note) => (
              <Card
                key={note._id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
              >
                <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4">
                  <div className="flex items-start gap-3 md:flex-1">
                    <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm line-clamp-1">{note.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {stripHtml(note.content || '')}
                      </p>
                      <div className="flex flex-wrap gap-1">
                      {(note.tags || []).map((tag: string) => {
                        const { className, style } = tagBadgeStyle(tag, tagColorMap[tag])
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => navigate(`/notes?tag=${encodeURIComponent(tag)}`)}
                          >
                            <Badge className={`text-xs ${className}`} style={style}>
                              {tag}
                            </Badge>
                          </button>
                        )
                      })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatUpdatedAt(note.updatedAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewNote(note)}
                        className="px-3 py-1 border rounded"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/notes/${note._id}`)}
                        className="px-3 py-1 border rounded"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(note._id)}
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
          <div className="mt-4 flex items-center justify-between">
            <div>Showing {notes.length} of {total}</div>
            <div className="flex items-center gap-2">
              <button disabled={page<=1} onClick={() => load(page-1)} className="px-3 py-1 border rounded">Previous</button>
              <button disabled={page*limit>=total} onClick={() => load(page+1)} className="px-3 py-1 border rounded">Next</button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No notes yet"
          description="Start documenting your development journey with your first note."
          actionLabel="Create Note"
          onAction={() => setCreateOpen(true)}
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Note</DialogTitle>
            <DialogDescription>Add your note details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              ref={titleInputRef}
              className="border p-2 w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
            />
            <RichTextEditor value={content} onChange={setContent} placeholder="Write your note..." />
            <input
              className="border p-2 w-full"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma separated)"
            />
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
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewNote} onOpenChange={() => setViewNote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewNote?.title}</DialogTitle>
            <DialogDescription>{formatUpdatedAt(viewNote?.updatedAt)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
            <div
              className="prose prose-invert max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: viewNote?.content || "" }}
            />
            {Array.isArray(viewNote?.tags) && viewNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {viewNote.tags.map((tag: string) => {
                  const { className, style } = tagBadgeStyle(tag, tagColorMap[tag])
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => navigate(`/notes?tag=${encodeURIComponent(tag)}`)}
                    >
                      <Badge className={`text-xs ${className}`} style={style}>
                        {tag}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const id = viewNote?._id
                  setViewNote(null)
                  if (id) navigate(`/notes/${id}`)
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
          if (!open) setConfirmDeleteId(null)
        }}
        title="Delete note?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
