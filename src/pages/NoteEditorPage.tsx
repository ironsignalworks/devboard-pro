import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getNote, updateNote, deleteNote } from '../api/notes'
import { listProjects } from '../api/projects'
import RichTextEditor from '@/components/RichTextEditor'
import { toast } from "@/components/ui/sonner";
import ConfirmDialog from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { FileText } from "lucide-react";

export default function NoteEditorPage(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [note, setNote] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [projectId, setProjectId] = useState('unassigned')
  const [projects, setProjects] = useState<any[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const parseTags = (raw: string) =>
    raw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const res = await getNote(id)
        if (cancelled) return
        setNote(res)
        setTitle(res.title || '')
        setContent(res.content || '')
        setTags(Array.isArray(res.tags) ? res.tags.join(', ') : '')
        setProjectId(res.projectId ? String(res.projectId) : 'unassigned')
      } catch (err) {
        console.error(err)
        setError("Failed to load note")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    listProjects({ page: 1, limit: 100 })
      .then((res: any) => {
        const items = Array.isArray(res?.items) ? res.items : []
        setProjects(items)
      })
      .catch((err) => console.error(err))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      await updateNote(id, {
        title,
        content,
        tags: parseTags(tags),
        projectId: projectId === "unassigned" ? null : projectId,
      })
      toast.success("Note updated")
      navigate('/notes')
    } catch (err) {
      console.error(err)
      toast.error("Failed to update note")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await deleteNote(id)
      toast.success("Note deleted")
      navigate('/notes')
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete note")
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  if (loading) {
    return <div className="p-4 sm:p-6 text-sm text-muted-foreground">Loading note...</div>
  }
  if (!note) {
    return (
      <EmptyState
        icon={FileText}
        title="Note not found"
        description={error || "This note may have been deleted or you may not have access."}
        actionLabel="Back to notes"
        onAction={() => navigate("/notes")}
      />
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl mb-4">Edit Note</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block mb-1">Title</label>
          <input className="border p-2 w-full" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Content</label>
          <RichTextEditor value={content} onChange={setContent} placeholder="Write your note..." />
        </div>
        <div>
          <label className="block mb-1">Tags</label>
          <input className="border p-2 w-full" value={tags} onChange={e => setTags(e.target.value)} placeholder="comma, separated, tags" />
        </div>
        <div>
          <label className="block mb-1">Project</label>
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button className="px-3 py-1 bg-primary text-white rounded w-full sm:w-auto" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={() => navigate('/notes')} className="px-3 py-1 border rounded w-full sm:w-auto">Cancel</button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="px-3 py-1 border rounded text-red-600 w-full sm:w-auto"
          >
            Delete
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete note?"
        description="This action cannot be undone."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
