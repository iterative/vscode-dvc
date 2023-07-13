import { join } from 'path'
import { stub } from 'sinon'
import { InternalCommands } from '../../../commands/internal'
import { Disposer } from '../../../extension'
import { Pipeline } from '../../../pipeline'
import { PipelineData } from '../../../pipeline/data'

export const buildPipeline = ({
  disposer,
  dvcRoot,
  internalCommands
}: {
  disposer: Disposer
  dvcRoot: string
  internalCommands: InternalCommands
}): Pipeline => {
  const data = new PipelineData(dvcRoot, internalCommands)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stub(data as any, 'findDvcYamls').resolves([join(dvcRoot, 'dvc.yaml')])
  const pipeline = disposer.track(new Pipeline(dvcRoot, internalCommands, data))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stub(pipeline as any, 'writeDag').resolves()
  return pipeline
}
