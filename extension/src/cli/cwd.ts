import { realpathSync } from 'fs'

export const getCwd = (path: string): string => {
  try {
    const cwd = realpathSync.native(path)
    if (cwd) {
      return cwd
    }
  } catch {}
  return path
}
