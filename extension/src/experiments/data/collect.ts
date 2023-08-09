import { ExpShowOutput } from '../../cli/dvc/contract'
import { uniqueValues } from '../../util/array'
import { getExpData } from '../columns/collect'

export const collectFiles = (
  output: ExpShowOutput,
  existingFiles: string[]
): string[] => {
  if (!output?.length) {
    return existingFiles
  }

  const [workspace] = output

  const data = getExpData(workspace)

  return uniqueValues([
    ...Object.keys({
      ...data?.params,
      ...data?.metrics
    }).filter(Boolean),
    ...existingFiles
  ])
}

const isCurrentBranch = (branch: string) => branch.indexOf('*') === 0

export const collectBranches = (
  allBranches: string[]
): { currentBranch: string; branches: string[] } => {
  let currentBranch = ''
  const branches: string[] = []

  for (const branch of allBranches) {
    const isCurrent = isCurrentBranch(branch)

    const cleanBranch = branch.replace('* ', '')

    if (!currentBranch && isCurrent) {
      currentBranch = cleanBranch
    }

    branches.push(cleanBranch)
  }

  return { branches, currentBranch }
}
