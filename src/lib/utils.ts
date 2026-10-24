export { cn } from 'cn';

export const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

export function getInitials(name: string, email: string) {
  const source = name.trim() || email;
  const words = source.split(/\s+/).filter(Boolean);

  return words.length > 1
    ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    : source.slice(0, 2).toUpperCase();
}
