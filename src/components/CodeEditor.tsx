import React from 'react'
import { Controlled as ControlledEditor } from 'react-codemirror2'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/dracula.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/jsx/jsx'
import 'codemirror/mode/xml/xml' // html
import 'codemirror/mode/css/css'
import 'codemirror/mode/python/python'
import 'codemirror/mode/clike/clike' // java, c

type Props = {
  value: string
  onChange: (v:string) => void
  language?: string
}

const mapLang = (lang?: string) => {
  if (!lang) return 'javascript'
  const l = lang.toLowerCase()
  if (['js','javascript'].includes(l)) return 'javascript'
  if (['ts','typescript'].includes(l)) return 'javascript'
  if (['jsx'].includes(l)) return 'jsx'
  if (['html','xml'].includes(l)) return 'xml'
  if (['css'].includes(l)) return 'css'
  if (['py','python'].includes(l)) return 'python'
  if (['java','c','cpp','csharp'].includes(l)) return 'clike'
  return 'javascript'
}

export default function CodeEditor({ value, onChange, language }: Props){
  const mode = mapLang(language)
  return (
    <div>
      <ControlledEditor
        value={value}
        options={{
          mode,
          theme: 'dracula',
          lineNumbers: true,
        }}
        onBeforeChange={(editor, data, v) => onChange(v)}
      />
    </div>
  )
}
