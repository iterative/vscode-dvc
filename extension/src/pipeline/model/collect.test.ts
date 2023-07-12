import { join } from 'path'
import { collectStages } from './collect'
import { dvcDemoPath } from '../../test/util'

// need to combine collect stages and collect pipelines as a pipeline is only valid if it has stages

describe('collectStages', () => {
  it('should handle a simple list of stages', () => {
    const { validPipelines, validStages } = collectStages({
      [dvcDemoPath]:
        'data.dvc  Outputs data\ntrain     Outputs model.pt, training/plots, hist.csv; Reports training/metrics.json'
    })
    expect(validStages).toStrictEqual(['train'])
    expect(validPipelines).toStrictEqual(new Set([dvcDemoPath]))
  })

  it('should handle a monorepos list of stages', () => {
    const { validStages, validPipelines, invalidPipelines } = collectStages({
      [join(dvcDemoPath, 'nested1')]: `data/data.xml.dvc   Outputs data.xml
    prepare    Outputs data/prepared
    featurize  Outputs data/features
    train      Outputs model.pkl
    evaluate   Outputs eval/importance.png, eval/live/plots, eval/prc; Reports eval/live/metri…`,
      [join('dvcDemoPath', 'nested2')]: 'data/data.xml.dvc   Outputs data.xml'
    })
    expect(validStages).toStrictEqual([
      'prepare',
      'featurize',
      'train',
      'evaluate'
    ])

    expect(validPipelines).toStrictEqual(
      new Set([join(dvcDemoPath, 'nested1')])
    )
    expect(invalidPipelines).toStrictEqual(new Set())
  })
})
