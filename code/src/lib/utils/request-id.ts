import { nanoid } from 'nanoid';

export function generateRequestId(): string {
  return `req-${nanoid(12)}`;
}
