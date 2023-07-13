import { join } from 'path'
import { stub } from 'sinon'
import { InternalCommands } from '../../../commands/internal'
import { Disposer } from '../../../extension'
import { Pipeline } from '../../../pipeline'
import { PipelineData } from '../../../pipeline/data'
import { dvcDemoPath } from '../../util'
import { DvcReader } from '../../../cli/dvc/reader'
import { buildDependencies } from '../util'
import { PipelineModel } from '../../../pipeline/model'

export const buildExperimentsPipeline = ({
  dag = '',
  disposer,
  dvcRoot = dvcDemoPath,
  dvcYamls,
  dvcReader,
  internalCommands,
  stageList = 'train'
}: {
  dag?: string
  disposer: Disposer
  dvcRoot?: string
  dvcYamls?: string[]
  dvcReader: DvcReader
  internalCommands: InternalCommands
  stageList?: string | null
}): Pipeline => {
  stub(dvcReader, 'stageList').resolves(stageList ?? undefined)
  stub(dvcReader, 'dag').resolves(dag)

  const data = new PipelineData(dvcRoot, internalCommands)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stub(data as any, 'findDvcYamls').resolves(
    dvcYamls || [join(dvcRoot, 'dvc.yaml')]
  )
  const pipeline = disposer.track(new Pipeline(dvcRoot, internalCommands, data))
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
  const { dvcReader, internalCommands } = buildDependencies(disposer)
  const pipeline = buildExperimentsPipeline({
    dag,
    disposer,
    dvcReader,
    dvcRoot,
    dvcYamls,
    internalCommands,
    stageList
  })
  return {
    dvcReader,
    internalCommands,
    pipeline,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pipelineData: (pipeline as any).data as PipelineData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pipelineModel: (pipeline as any).model as PipelineModel
  }
}
