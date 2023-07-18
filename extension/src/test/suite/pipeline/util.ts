import { join } from 'path'
import { stub } from 'sinon'
import { InternalCommands } from '../../../commands/internal'
import { Disposer } from '../../../extension'
import { Pipeline } from '../../../pipeline'
import { PipelineData } from '../../../pipeline/data'
import { dvcDemoPath } from '../../util'
import { buildDependencies } from '../util'

export const buildExperimentsPipeline = ({
  disposer,
  dvcRoot = dvcDemoPath,
  dvcYamls,
  internalCommands
}: {
  disposer: Disposer
  dvcRoot?: string
  dvcYamls?: string[]
  internalCommands: InternalCommands
}): Pipeline => {
  const data = new PipelineData(dvcRoot, internalCommands, [])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stub(data as any, 'findDvcYamls').resolves(
    dvcYamls || [join(dvcRoot, 'dvc.yaml')]
  )
  const pipeline = disposer.track(
    new Pipeline(dvcRoot, internalCommands, [], data)
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stub(pipeline as any, 'writeDag').resolves()
  return pipeline
}

export const buildPipeline = ({
  dag = '',
  disposer,
  dvcRoot = dvcDemoPath,
  dvcYamls,
  stageList = 'train'
}: {
  dag?: string
  disposer: Disposer
  dvcRoot?: string
  dvcYamls?: string[]
  stageList?: string | null
}) => {
  const { dvcReader, internalCommands } = buildDependencies({
    dag,
    disposer,
    stageList
  })

  const pipeline = buildExperimentsPipeline({
    disposer,
    dvcRoot,
    dvcYamls,
    internalCommands
  })
  return {
    dvcReader,
    internalCommands,
    pipeline,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pipelineData: (pipeline as any).data as PipelineData
  }
}
