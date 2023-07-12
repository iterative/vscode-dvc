import { join } from 'path'
import { trimAndSplit } from '../../util/stdout'

export const collectStages = (stageList: string): string[] => {
  const stages: string[] = []
  for (const stageStr of trimAndSplit(stageList)) {
    const stage = stageStr.split(/\s+/)?.[0]?.trim()
    if (!stage || stage.endsWith('.dvc')) {
      continue
    }
    stages.push(stage)
  }
  return stages
}

export const collectPipelines = (
  dvcRoot: string,
  stages: string[]
): Set<string> => {
  const dvcYamlIdentifier = '/dvc.yaml:'
  const pipelines = new Set<string>()
  for (const stage of stages) {
    if (!stage.includes(dvcYamlIdentifier)) {
      pipelines.add(dvcRoot)
      continue
    }
    const [pipeline] = stage.split(dvcYamlIdentifier)
    pipelines.add(join(dvcRoot, ...pipeline.split('/')))
  }
  return pipelines
}
