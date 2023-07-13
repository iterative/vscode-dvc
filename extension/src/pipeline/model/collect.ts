import { trimAndSplit } from '../../util/stdout'

export const collectStages = (data: {
  [pipeline: string]: string | undefined
}): {
  pipelines: Set<string>
  stages: string[]
  // eslint-disable-next-line sonarjs/cognitive-complexity
} => {
  const stages: string[] = []
  const pipelines = new Set<string>()

  for (const [pipeline, stageList] of Object.entries(data)) {
    if (stageList === undefined) {
      pipelines.add(pipeline)
    }

    if (!stageList) {
      continue
    }
    for (const stageStr of trimAndSplit(stageList)) {
      const stage = stageStr.split(/\s+/)?.[0]?.trim()
      if (!stage || stage.endsWith('.dvc')) {
        continue
      }
      stages.push(stage)
      pipelines.add(pipeline)
    }
  }
  return { pipelines, stages }
}
