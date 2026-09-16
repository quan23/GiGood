function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** `HH:mm` for today, `dd/MM` for older dates — shared by list rows and bubbles. */
export function formatChatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (sameDay) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`
}
