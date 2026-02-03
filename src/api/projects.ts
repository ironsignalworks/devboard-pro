import call from './client'

export const listProjects = (opts: { page?: number, limit?: number, q?: string, status?: string, tag?: string } = {}) => {
  const params = new URLSearchParams()
  if (opts.page) params.set('page', String(opts.page))
  if (opts.limit) params.set('limit', String(opts.limit))
  if (opts.q) params.set('q', opts.q)
  if (opts.status) params.set('status', opts.status)
  if (opts.tag) params.set('tag', opts.tag)
  const path = '/api/projects' + (params.toString() ? `?${params.toString()}` : '')
  return call(path)
}

export const createProject = (data:any) => call('/api/projects', { method: 'POST', body: JSON.stringify(data) })
export const getProject = (id: string) => call(`/api/projects/${id}`)
export const updateProject = (id: string, data: any) => call(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteProject = (id: string) => call(`/api/projects/${id}`, { method: 'DELETE' })
