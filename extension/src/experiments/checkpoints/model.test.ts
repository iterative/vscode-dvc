import { join } from 'path'
import { CheckpointsModel } from './model'
import { dvcDemoPath } from '../../test/util'

describe('CheckpointsModel', () => {
  it('should keep a record of yaml files that have checkpoints', () => {
    const experimentCheckpointsModel = new CheckpointsModel()
    expect(experimentCheckpointsModel.hasCheckpoints()).toBe(false)

    const rootYamlHasCheckpoints = {
      path: join(dvcDemoPath, 'dvc.yaml'),
      yaml: {
        stages: {
          train: {
            outs: [{ 'model.pt': { checkpoint: true } }]
          }
        }
      }
    }

    const extraYamlHasCheckpoints = {
      path: join(dvcDemoPath, 'extra', 'dvc.yaml'),
      yaml: {
        stages: {
          train: {
            outs: [{ 'extra-model.pt': { checkpoint: true } }]
          }
        }
      }
    }

    const rootYamlNoCheckpoints = {
      path: join(dvcDemoPath, 'dvc.yaml'),
      yaml: {
        stages: { train: { outs: ['model.pt'] } }
      }
    }

    const extraYamlNoCheckpoints = {
      path: join(dvcDemoPath, 'extra', 'dvc.yaml'),
      yaml: {
        stages: { train: { outs: ['extra-model.pt'] } }
      }
    }

    experimentCheckpointsModel.transformAndSet(rootYamlHasCheckpoints)
    expect(experimentCheckpointsModel.hasCheckpoints()).toBe(true)

    experimentCheckpointsModel.transformAndSet(extraYamlHasCheckpoints)
    expect(experimentCheckpointsModel.hasCheckpoints()).toBe(true)

    experimentCheckpointsModel.transformAndSet(rootYamlNoCheckpoints)
    expect(experimentCheckpointsModel.hasCheckpoints()).toBe(true)

    experimentCheckpointsModel.transformAndSet(extraYamlNoCheckpoints)

    expect(experimentCheckpointsModel.hasCheckpoints()).toBe(false)
  })
})
