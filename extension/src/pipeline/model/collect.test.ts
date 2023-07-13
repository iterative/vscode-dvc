import { join } from 'path'
import { collectStages } from './collect'
import { dvcDemoPath } from '../../test/util'

describe('collectStages', () => {
  it('should handle a simple list of stages', () => {
    const { pipelines, stages } = collectStages({
      [dvcDemoPath]:
        'data.dvc  Outputs data\ntrain     Outputs model.pt, training/plots, hist.csv; Reports training/metrics.json'
    })
    expect(stages).toStrictEqual(['train'])
    expect(pipelines).toStrictEqual(new Set([dvcDemoPath]))
  })

  it('should handle a monorepos list of stages', () => {
    const { stages, pipelines } = collectStages({
      [join(dvcDemoPath, 'nested1')]: `data/data.xml.dvc   Outputs data.xml
    prepare    Outputs data/prepared
    featurize  Outputs data/features
    train      Outputs model.pkl
    evaluate   Outputs eval/importance.png, eval/live/plots, eval/prc; Reports eval/live/metri…`,
      [join('dvcDemoPath', 'nested2')]: 'data/data.xml.dvc   Outputs data.xml',
      [join('dvcDemoPath', 'nested3')]: undefined
    })
    expect(stages).toStrictEqual(['prepare', 'featurize', 'train', 'evaluate'])

    expect(pipelines).toStrictEqual(
      new Set([join(dvcDemoPath, 'nested1'), join(dvcDemoPath, 'nested3')])
    )
  })
})
