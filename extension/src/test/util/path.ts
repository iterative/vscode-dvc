// These functions mirror the vanilla path ones, but work in the browser for Storybook
import path from 'path'
const sep = path.sep || '/'
export const join = (...segments: string[]) => segments.join(sep)
