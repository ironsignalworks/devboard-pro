import call from './client'

export const listSnippets = (opts: { page?: number, limit?: number, q?: string, tag?: string, projectId?: string } = {}) => {
  const params = new URLSearchParams()
  if (opts.page) params.set('page', String(opts.page))
  if (opts.limit) params.set('limit', String(opts.limit))
  if (opts.q) params.set('q', opts.q)
  if (opts.tag) params.set('tag', opts.tag)
  if (opts.projectId) params.set('projectId', opts.projectId)
  const path = '/api/snippets' + (params.toString() ? `?${params.toString()}` : '')
  return call(path)
}
export const createSnippet = (data: any) => call('/api/snippets', { method: 'POST', body: JSON.stringify(data) })

export const getSnippet = (id: string) => call(`/api/snippets/${id}`)
export const updateSnippet = (id: string, data: any) => call(`/api/snippets/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteSnippet = (id: string) => call(`/api/snippets/${id}`, { method: 'DELETE' })
