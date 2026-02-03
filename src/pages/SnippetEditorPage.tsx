import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSnippet, updateSnippet } from '../api/snippets'
import CodeEditor from '../components/CodeEditor'
import { toast } from "@/components/ui/sonner";
import { EmptyState } from "@/components/EmptyState";
import { Code2 } from "lucide-react";

export default function SnippetEditorPage(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [snippet, setSnippet] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState<string | undefined>(undefined)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(()=>{
    let cancelled = false
    const load = async ()=>{
      if (!id) return
      setLoading(true)
      try{
        const res = await getSnippet(id)
        if (cancelled) return
        setSnippet(res)
        setTitle(res.title || '')
        setCode(res.code || '')
          setDescription(res.description || '')
          setLanguage(res.language || undefined)
      }catch(err){
        console.error(err)
        setError("Failed to load snippet")
      }finally{ if (!cancelled) setLoading(false) }
    }
    load()
    return ()=>{ cancelled = true }
  },[id])

  const handleSave = async (e:React.FormEvent)=>{
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      await updateSnippet(id, { title, code, description, language })
      toast.success("Snippet updated")
      navigate('/snippets')
    } catch (err) {
      console.error(err)
      toast.error("Failed to update snippet")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading snippet...</div>
  if (!snippet) {
    return (
      <EmptyState
        icon={Code2}
        title="Snippet not found"
        description={error || "This snippet may have been deleted or you may not have access."}
        actionLabel="Back to snippets"
        onAction={() => navigate("/snippets")}
      />
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl mb-4">Edit Snippet</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block mb-1">Title</label>
          <input className="border p-2 w-full" value={title} onChange={e=>setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Description</label>
          <textarea className="border p-2 w-full" value={description} onChange={e=>setDescription(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Code</label>
          <div className="mb-2">
            <label className="text-sm mr-2">Language</label>
            <select className="border p-1" value={language || ''} onChange={e=>{ setLanguage(e.target.value || undefined) }}>
              <option value="">Auto</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>
          </div>
          <CodeEditor value={code} onChange={setCode} language={language || snippet?.language} />
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 bg-primary text-white rounded" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={()=>navigate('/snippets')} className="px-3 py-1 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  )
}
