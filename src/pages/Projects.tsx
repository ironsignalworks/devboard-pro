import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { listProjects, createProject, deleteProject } from "../api/projects";
import { listTags } from "../api/tags";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRef } from "react";
import { tagBadgeStyle } from "@/lib/tagColors";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "@/components/ui/sonner";
import ListSkeleton from "@/components/ListSkeleton";

export default function Projects(){
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "archived">("all");
  const [projects, setProjects] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('active')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [viewProject, setViewProject] = useState<any | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const [searchParams] = useSearchParams()
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [tagColorMap, setTagColorMap] = useState<Record<string, string>>({})
  const navigate = useNavigate()

  const parseTags = (raw: string) =>
    raw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

  const load = async (p=1, overrideTag?: string)=>{
    setLoading(true)
    try{
      const activeTag = overrideTag !== undefined ? overrideTag : tagFilter
      const res = await listProjects({
        page: p,
        limit: 9,
        q: q.trim() || undefined,
        tag: activeTag.trim() || undefined,
        status: filter === "all" ? undefined : filter,
      })
      setProjects(res?.items || [])
      setTotal(res?.total || 0)
      setPage(res?.page || p)
    }catch(err){ console.error(err) }finally{ setLoading(false) }
  }

  useEffect(()=>{ load(1) },[filter])

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
    listTags()
      .then((res: any) => {
        const items = Array.isArray(res?.items) ? res.items : []
        setTagSuggestions(items.map((t: any) => t.name).filter(Boolean))
        const nextMap: Record<string, string> = {}
        for (const tag of items) {
          if (tag?.name && tag?.color) nextMap[tag.name] = tag.color
        }
        setTagColorMap(nextMap)
      })
      .catch((err) => console.error(err))
  }, [])

  const addTag = (value: string) => {
    const existing = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    if (existing.includes(value)) return
    const next = [...existing, value].join(", ")
    setTags(next)
  }

  const handleCreate = async ()=>{
    if (!title) return
    try {
      const res: any = await createProject({ title, description, status, tags: parseTags(tags) })
      if (res?.__error) throw new Error(res?.message || "Failed to create project")
      setTitle('')
      setDescription('')
      setStatus('active')
      setTags('')
      setCreateOpen(false)
      toast.success("Project created")
      load(1)
    } catch (err) {
      console.error(err)
      toast.error("Failed to create project")
    }
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    try {
      await deleteProject(confirmDeleteId)
      toast.success("Project deleted")
      load(page)
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete project")
    } finally {
      setConfirmDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Projects</h1>
          <p className="text-muted-foreground">Organize snippets and notes into projects</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Create
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="border p-2 w-full sm:w-[240px]"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search projects"
        />
        <input
          className="border p-2 w-full sm:w-[200px]"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          placeholder="Filter by tag"
        />
        <Button variant="outline" onClick={() => load(1)}>Search</Button>
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

      {loading ? <ListSkeleton rows={4} /> : (
        projects.length > 0 ? (
          <div>
            <div className="space-y-3">
            {projects.map((project)=> (
                <div key={project._id} className="border rounded">
                  <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4">
                    <div className="flex items-start gap-3 md:flex-1">
                      <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                        <FolderKanban className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-medium">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                        <div className="text-xs text-muted-foreground">
                          {project.snippetsCount} snippets | {project.notesCount} notes
                        </div>
                        {Array.isArray(project.tags) && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {project.tags.map((tag: string) => {
                              const { className, style } = tagBadgeStyle(tag, tagColorMap[tag])
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => navigate(`/projects?tag=${encodeURIComponent(tag)}`)}
                                >
                                  <Badge className={`text-xs ${className}`} style={style}>
                                    {tag}
                                  </Badge>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                      <button onClick={() => setViewProject(project)} className="px-3 py-1 border rounded">View</button>
                      <button onClick={()=>navigate(`/projects/${project._id}`)} className="px-3 py-1 border rounded">Edit</button>
                      <button onClick={() => setConfirmDeleteId(project._id)} className="px-3 py-1 border rounded text-red-600">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>Showing {projects.length} of {total}</div>
              <div className="flex items-center gap-2">
                <button disabled={page<=1} onClick={()=>load(page-1)} className="px-3 py-1 border rounded">Previous</button>
                <button disabled={page*9>=total} onClick={()=>load(page+1)} className="px-3 py-1 border rounded">Next</button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to start organizing your work."
            actionLabel="Create Project"
            onAction={() => setCreateOpen(true)}
          />
        )
      )}

      <Dialog open={!!viewProject} onOpenChange={() => setViewProject(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewProject?.title}</DialogTitle>
            <DialogDescription>{viewProject?.description || ""}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
            <p className="text-sm text-muted-foreground">Snippets: {viewProject?.snippetsCount ?? 0} | Notes: {viewProject?.notesCount ?? 0}</p>
            {Array.isArray(viewProject?.tags) && viewProject.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {viewProject.tags.map((tag: string) => {
                  const { className, style } = tagBadgeStyle(tag, tagColorMap[tag])
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => navigate(`/projects?tag=${encodeURIComponent(tag)}`)}
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
                  const id = viewProject?._id
                  setViewProject(null)
                  if (id) navigate(`/projects/${id}`)
                }}
                className="px-3 py-1 border rounded"
              >
                Edit
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Add project details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              ref={titleInputRef}
              className="border p-2 w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
            />
            <textarea
              className="border p-2 w-full min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description"
            />
            <select
              className="border p-2 w-full"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            <input
              className="border p-2 w-full"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma separated)"
            />
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
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null)
        }}
        title="Delete project?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  )
}
