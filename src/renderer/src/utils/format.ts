export const formatDate = (dateString: string, locale: string) => {
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}
