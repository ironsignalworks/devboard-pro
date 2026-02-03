import call from './client'

export const listNotes = (opts: { page?: number, limit?: number, q?: string, tag?: string, projectId?: string } = {}) => {
  const params = new URLSearchParams()
  if (opts.page) params.set('page', String(opts.page))
  if (opts.limit) params.set('limit', String(opts.limit))
  if (opts.q) params.set('q', opts.q)
  if (opts.tag) params.set('tag', opts.tag)
  if (opts.projectId) params.set('projectId', opts.projectId)
  const path = '/api/notes' + (params.toString() ? `?${params.toString()}` : '')
  return call(path)
}

export const createNote = (data: any) => call('/api/notes', { method: 'POST', body: JSON.stringify(data) })
export const getNote = (id: string) => call(`/api/notes/${id}`)
export const updateNote = (id: string, data: any) => call(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteNote = (id: string) => call(`/api/notes/${id}`, { method: 'DELETE' })
