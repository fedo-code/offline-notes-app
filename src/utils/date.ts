export function formatDate(date: string | number) {
  const d = new Date(date);
  return d.toLocaleString();
}
