import { join } from 'path'
import { collectPipelines } from './collect'
import { dvcDemoPath } from '../../test/util'

describe('collectPipelines', () => {
  it('should handle a simple list of stages', () => {
    const pipelines = collectPipelines({
      [dvcDemoPath]:
        'data.dvc  Outputs data\ntrain     Outputs model.pt, training/plots, hist.csv; Reports training/metrics.json'
    })

    expect(pipelines).toStrictEqual(new Set([dvcDemoPath]))
  })

  it('should handle a monorepos list of stages', () => {
    const pipelines = collectPipelines({
      [join(dvcDemoPath, 'nested1')]: `data/data.xml.dvc   Outputs data.xml
    prepare    Outputs data/prepared
    featurize  Outputs data/features
    train      Outputs model.pkl
    evaluate   Outputs eval/importance.png, eval/live/plots, eval/prc; Reports eval/live/metri…`,
      [join(dvcDemoPath, 'nested2')]: 'data/data.xml.dvc   Outputs data.xml',
      [join(dvcDemoPath, 'nested3')]: undefined
    })

    expect(pipelines).toStrictEqual(
      new Set([join(dvcDemoPath, 'nested1'), join(dvcDemoPath, 'nested3')])
    )
  })
})
