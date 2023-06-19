export const trimAndSplit = (stdout: string): string[] =>
  stdout
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

export const cleanUpBranchName = (branch: string) =>
  branch
    .replace('* ', '')
    .replace(/\(HEAD\s\w+\s\w+\s/, '')
    .replace(')', '')
