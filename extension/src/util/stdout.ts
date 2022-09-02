export const trimAndSplit = (stdout: string): string[] =>
  stdout.trim().split('\n').filter(Boolean)
