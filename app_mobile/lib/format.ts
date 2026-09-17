const vndFormatter = new Intl.NumberFormat('vi-VN')

export function formatVnd(num: number): string {
  return `${vndFormatter.format(num)} VND`
}
