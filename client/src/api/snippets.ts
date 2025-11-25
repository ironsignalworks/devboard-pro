import call from './client'

export const listSnippets = () => call('/api/snippets')
export const createSnippet = (data: any) => call('/api/snippets', { method: 'POST', body: JSON.stringify(data) })
