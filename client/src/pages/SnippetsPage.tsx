import React, { useEffect, useState } from 'react'
import { listSnippets } from '../api/snippets'

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<any[]>([])

  useEffect(()=>{
    (async()=>{
      const res = await listSnippets()
      setSnippets(res || [])
    })()
  },[])

  return (
    <div className="p-6">
      <h1>Snippets</h1>
      <ul>
        {snippets.map(s=> <li key={s._id}>{s.title}</li>)}
      </ul>
    </div>
  )
}
