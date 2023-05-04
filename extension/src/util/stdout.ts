export const trimAndSplit = (stdout: string): string[] =>
  stdout
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
