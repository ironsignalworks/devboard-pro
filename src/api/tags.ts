import call from './client'

export const listTags = () => call('/api/tags')
export const createTag = (data: { name: string; color?: string }) => call('/api/tags', { method: 'POST', body: JSON.stringify(data) })
export const renameTag = (from: string, to: string) => call('/api/tags/rename', { method: 'PUT', body: JSON.stringify({ from, to }) })
export const deleteTag = (name: string) => call(`/api/tags/${encodeURIComponent(name)}`, { method: 'DELETE' })
