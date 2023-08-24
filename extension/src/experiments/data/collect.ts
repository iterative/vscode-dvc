import { ExpData, ExpShowOutput, MetricsOrParams } from '../../cli/dvc/contract'
import { getExpData } from '../columns/collect'

const collectFilesFromKeys = (
  acc: Set<string>,
  metricsOrParams: MetricsOrParams | null | undefined
): void => {
  for (const file of Object.keys(metricsOrParams || {})) {
    if (!file) {
      continue
    }
    acc.add(file)
  }
}

const collectFilesFromExperiment = (
  acc: Set<string>,
  data: ExpData | undefined
) => {
  if (!data) {
    return
  }
  collectFilesFromKeys(acc, data.params)
  collectFilesFromKeys(acc, data.metrics)
}

export const collectFiles = (
  output: ExpShowOutput,
  existingFiles: string[]
): string[] => {
  if (!output?.length) {
    return existingFiles
  }

  const acc = new Set(existingFiles)

  for (const commit of output) {
    const data = getExpData(commit)
    collectFilesFromExperiment(acc, data)

    const { experiments } = commit

    if (!experiments?.length) {
      continue
    }

    for (const { revs } of experiments) {
      const [experiment] = revs
      collectFilesFromExperiment(acc, getExpData(experiment))
    }
  }

  return [...acc]
}

const isCurrentBranch = (branch: string) => branch.indexOf('*') === 0

export const collectBranches = (
  allBranches: string[]
): {
  currentBranch: string
  branches: string[]
  branchesToSelect: string[]
} => {
  let currentBranch = ''
  const branches: string[] = []
  const branchesToSelect: string[] = []

  for (const branch of allBranches) {
    const isCurrent = isCurrentBranch(branch)

    const cleanBranch = branch.replace('* ', '')

    branches.push(cleanBranch)

    if (isCurrent) {
      if (!currentBranch) {
        currentBranch = cleanBranch
      }
      continue
    }

    branchesToSelect.push(cleanBranch)
  }

  return { branches, branchesToSelect, currentBranch }
}
