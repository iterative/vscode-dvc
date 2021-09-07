import path from 'path'

// These functions mirror the vanilla path ones, but work in the browser for Storybook
export const sep = path ? path.sep : '/'
export const join = (...segments: string[]) => segments.join(sep)
