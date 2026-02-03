import call from './client'

export const searchAll = (q: string, type: "all" | "snippets" | "notes" | "projects" = "all") => {
  const params = new URLSearchParams()
  params.set('q', q)
  params.set('type', type)
  return call(`/api/search?${params.toString()}`)
}
