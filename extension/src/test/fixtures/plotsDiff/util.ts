import { EXPERIMENT_WORKSPACE_ID } from '../../../cli/dvc/contract'

export const getCLIIdToLabel = (): { [rev: string]: string } => ({
  [EXPERIMENT_WORKSPACE_ID]: EXPERIMENT_WORKSPACE_ID,
  '53c3851': 'main',
  'exp-e7a67': '4fb124a',
  'test-branch': '42b8736',
  'exp-83425': '1ba7bcd'
})

export const replaceCommitCLIId = (revision: string): string => {
  const mapping = getCLIIdToLabel()

  return mapping[revision] || revision
}

export const getCLICommitId = (revision: string): string => {
  const mapping: { [rev: string]: string } = {
    main: '53c3851',
    '4fb124a': 'exp-e7a67',
    '42b8736': 'test-branch',
    '1ba7bcd': 'exp-83425'
  }

  return mapping[revision] || revision
}
