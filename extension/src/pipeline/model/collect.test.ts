import { join } from 'path'
import { collectPipelines, collectStages } from './collect'
import { dvcDemoPath } from '../../test/util'

describe('collectStages', () => {
  it('should handle a simple list of stages', () => {
    const stages = collectStages(
      'data.dvc  Outputs data\ntrain     Outputs model.pt, training/plots, hist.csv; Reports training/metrics.json'
    )
    expect(stages).toStrictEqual(['train'])
  })

  it('should handle a monorepos list of stages', () => {
    const stages = collectStages(
      `nested1/data/data.xml.dvc   Outputs data.xml
    nested1/dvc.yaml:prepare    Outputs data/prepared
    nested1/dvc.yaml:featurize  Outputs data/features
    nested1/dvc.yaml:train      Outputs model.pkl
    nested1/dvc.yaml:evaluate   Outputs eval/importance.png, eval/live/plots, eval/prc; Reports eval/live/metri…
    nested2/data/data.xml.dvc   Outputs data.xml`
    )
    expect(stages).toStrictEqual([
      'nested1/dvc.yaml:prepare',
      'nested1/dvc.yaml:featurize',
      'nested1/dvc.yaml:train',
      'nested1/dvc.yaml:evaluate'
    ])
  })
})

describe('collectPipelines', () => {
  it('should handle a list of stages', () => {
    const pipelines = collectPipelines(dvcDemoPath, [
      'train',
      'nested1/dvc.yaml:prepare',
      'nested1/dvc.yaml:featurize',
      'nested1/dvc.yaml:train',
      'nested1/dvc.yaml:evaluate'
    ])
    expect(pipelines).toStrictEqual(
      new Set([dvcDemoPath, join(dvcDemoPath, 'nested1')])
    )
  })
})
