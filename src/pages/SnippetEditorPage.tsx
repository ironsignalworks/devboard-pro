import React from 'react'
import { useParams } from 'react-router-dom'

export default function SnippetEditorPage(){
  const { id } = useParams()
  return (
    <div className="p-6">
      <h1>Snippet Editor</h1>
      <p>Snippet ID: {id}</p>
    </div>
  )
}
