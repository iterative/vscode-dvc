export const trim = (stdout: string): string => stdout.trim()

export const trimAndSplit = (stdout: string): string[] =>
  trim(stdout).split('\n').filter(Boolean)
