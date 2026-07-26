import { format } from 'date-fns';

// `datetime-local` inputs work in wall-clock time, not UTC — format/parse in local time.
const DATETIME_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm";

export function toDatetimeLocalValue(iso: string): string {
  return format(new Date(iso), DATETIME_LOCAL_FORMAT);
}
