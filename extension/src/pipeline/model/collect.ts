import { trimAndSplit } from '../../util/stdout'

export const collectStages = (pipelines: {
  [pipeline: string]: string | undefined
}): {
  invalidPipelines: Set<string>
  validPipelines: Set<string>
  validStages: string[]
  // eslint-disable-next-line sonarjs/cognitive-complexity
} => {
  const validStages: string[] = []
  const validPipelines = new Set<string>()
  const invalidPipelines = new Set<string>()

  for (const [pipeline, stageList] of Object.entries(pipelines)) {
    if (stageList === undefined) {
      invalidPipelines.add(pipeline)
    }

    if (!stageList) {
      continue
    }
    for (const stageStr of trimAndSplit(stageList)) {
      const stage = stageStr.split(/\s+/)?.[0]?.trim()
      if (!stage || stage.endsWith('.dvc')) {
        continue
      }
      validStages.push(stage)
      validPipelines.add(pipeline)
    }
  }
  return { invalidPipelines, validPipelines, validStages }
}
