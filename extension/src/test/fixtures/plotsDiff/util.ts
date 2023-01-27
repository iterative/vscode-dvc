export const replaceCommitCLIId = (revision: string): string => {
  if (revision === '53c3851') {
    return 'main'
  }
  return revision
}

export const getCLICommitId = (revision: string): string => {
  if (revision === 'main') {
    return '53c3851'
  }
  return revision
}
