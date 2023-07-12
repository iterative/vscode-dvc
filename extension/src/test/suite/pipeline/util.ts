import { stub } from 'sinon'
import { InternalCommands } from '../../../commands/internal'
import { Disposer } from '../../../extension'
import { Pipeline } from '../../../pipeline'

export const buildPipeline = ({
  disposer,
  dvcRoot,
  internalCommands
}: {
  disposer: Disposer
  dvcRoot: string
  internalCommands: InternalCommands
}): Pipeline => {
  const pipeline = disposer.track(new Pipeline(dvcRoot, internalCommands))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stub(pipeline as any, 'writeDag').resolves()
  return pipeline
}
