import React, { useEffect, useState } from 'react'
import { listSnippets, createSnippet, deleteSnippet } from '../api/snippets'
import { debounce } from 'lodash'
import { useNavigate } from 'react-router-dom'

export default function SnippetsPage(){
  const [snippets, setSnippets] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const navigate = useNavigate()

  const load = async (p=1)=>{
    setLoading(true)
    try{
      const res = await listSnippets({ page: p, limit: 10 })
      setSnippets(res?.items || [])
      setTotal(res?.total || 0)
      setPage(res?.page || p)
    }catch(err){ console.error(err) }finally{ setLoading(false) }
  }

  // search
  const [q, setQ] = useState('')
  const [tag, setTag] = useState<string | null>(null)
  const doSearch = debounce(async (term:string)=>{
    setLoading(true)
    try{
      const res = await listSnippets({ page: 1, limit: 10, q: term, tag: tag || undefined })
      setSnippets(res?.items || [])
      setTotal(res?.total || 0)
      setPage(res?.page || 1)
    }catch(err){ console.error(err) }finally{ setLoading(false) }
  }, 300)

  useEffect(()=>{ load() },[])

  const handleCreate = async (e: React.FormEvent)=>{
    e.preventDefault()
    if (!title) return
    await createSnippet({ title, code: '', description: '' })
    setTitle('')
    load(1)
  }

  const handleDelete = async (id:string)=>{
    if (!confirm('Delete snippet?')) return
    await deleteSnippet(id)
    load(page)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl">Snippets</h1>
        <div className="flex items-center space-x-2">
          <input className="border p-2" value={title} onChange={e=>setTitle(e.target.value)} placeholder="New snippet title" />
          <button className="bg-primary text-white px-3 py-1 rounded" onClick={handleCreate}>Create</button>
        </div>
      </div>
      <div className="mb-4 space-y-2">
        <input value={q} onChange={e=>{ setQ(e.target.value); doSearch(e.target.value) }} placeholder="Search snippets" className="border p-2 w-full" />
        <div className="flex items-center space-x-2">
          <input value={tag || ''} onChange={e=>setTag(e.target.value || null)} placeholder="Filter by tag" className="border p-2" />
          <button onClick={() => { doSearch(q); }} className="px-3 py-1 border rounded">Apply Tag</button>
          <button onClick={() => { setTag(null); setQ(''); load(1); }} className="px-3 py-1 border rounded">Clear</button>
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <div>
          <ul>
            {snippets.map(s=> (
              <li key={s._id} className="flex items-center justify-between border-b py-2">
                <div>
                  <a className="text-primary hover:underline" href={`/snippets/${s._id}`}>{s.title}</a>
                  <div className="text-sm text-muted-foreground">{s.language || '—'}</div>
                </div>
                <div className="space-x-2">
                  <button onClick={()=>navigate(`/snippets/${s._id}`)} className="px-2 py-1 border rounded">Edit</button>
                  <button onClick={()=>handleDelete(s._id)} className="px-2 py-1 border rounded text-red-600">Delete</button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between">
            <div>Showing {snippets.length} of {total}</div>
            <div className="space-x-2">
              <button disabled={page<=1} onClick={()=>load(page-1)} className="px-3 py-1 border rounded">Previous</button>
              <button disabled={page*10>=total} onClick={()=>load(page+1)} className="px-3 py-1 border rounded">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
