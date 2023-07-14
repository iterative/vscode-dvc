import { trimAndSplit } from '../../util/stdout'

const failedValidation = (stageList: string | undefined): boolean =>
  stageList === undefined

const hasStages = (stageList: string | undefined): stageList is string =>
  !!stageList

const hasValidStage = (stageList: string | undefined): boolean => {
  if (!hasStages(stageList)) {
    return false
  }

  for (const stageStr of trimAndSplit(stageList)) {
    const stage = stageStr.split(/\s+/)?.[0]?.trim()
    if (!stage || stage.endsWith('.dvc')) {
      continue
    }

    return true
  }
  return false
}

export const collectPipelines = (data: {
  [pipeline: string]: string | undefined
}): Set<string> => {
  const pipelines = new Set<string>()

  for (const [pipeline, stageList] of Object.entries(data)) {
    if (failedValidation(stageList) || hasValidStage(stageList)) {
      pipelines.add(pipeline)
    }
  }
  return pipelines
}
