export const replaceBranchCLIId = (revision: string): string => {
  if (revision === '53c3851') {
    return 'main'
  }
  return revision
}

export const getCLIBranchId = (revision: string): string => {
  if (revision === 'main') {
    return '53c3851'
  }
  return revision
}
