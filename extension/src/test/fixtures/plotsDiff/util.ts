export const replaceBranchRevision = (revision: string): string => {
  if (revision === '53c3851') {
    return 'main'
  }
  return revision
}

export const getCLIBranchId = (revision: string): string =>
  revision === 'main' ? '53c3851' : revision
