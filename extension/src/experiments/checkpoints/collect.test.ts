import { collectHasCheckpoints } from './collect'
import { PartialDvcYaml } from '../../fileSystem'

describe('collectHasCheckpoints', () => {
  it('should correctly identify that the demo project has checkpoints', () => {
    const hasCheckpoints = collectHasCheckpoints({
      stages: {
        train: {
          cmd: 'python train.py',
          deps: ['data/MNIST', 'train.py'],
          live: { logs: { html: true, summary: true } },
          outs: [{ 'model.pt': { checkpoint: true } }],
          params: ['seed', 'lr', 'weight_decay'],
          plots: [
            'plots',
            {
              'predictions.json': {
                cache: false,
                template: 'confusion',
                x: 'actual',
                y: 'predicted'
              }
            }
          ]
        }
      }
    } as PartialDvcYaml)
    expect(hasCheckpoints).toBe(true)
  })

  it('should correctly classify a dvc.yaml without checkpoint', () => {
    const hasCheckpoints = collectHasCheckpoints({
      stages: {
        extract: {
          cmd: 'tar -xzf data/images.tar.gz --directory data',
          deps: ['data/images.tar.gz'],
          outs: [{ 'data/images/': { cache: false } }]
        },
        train: {
          cmd: 'python3 src/train.py',
          deps: ['data/images/', 'src/train.py'],
          live: { logs: { html: true, summary: true } },
          metrics: [{ 'metrics.json': { cache: false } }],
          outs: ['models/model.h5'],
          params: ['model.conv_units', 'train.epochs'],
          plots: [{ 'logs.csv': { cache: false } }]
        }
      }
    } as PartialDvcYaml)

    expect(hasCheckpoints).toBe(false)
  })

  it('should correctly classify a more complex dvc.yaml without checkpoint', () => {
    const hasCheckpoints = collectHasCheckpoints({
      stages: {
        evaluate: {
          cmd: 'python src/evaluate.py model.pkl data/features scores.json prc.json roc.json',
          deps: ['data/features', 'model.pkl', 'src/evaluate.py'],
          metrics: [{ 'scores.json': { cache: false } }],
          plots: [
            { 'prc.json': { cache: false, x: 'recall', y: 'precision' } },
            { 'roc.json': { cache: false, x: 'fpr', y: 'tpr' } }
          ]
        },
        featurize: {
          cmd: 'python src/featurization.py data/prepared data/features',
          deps: ['data/prepared', 'src/featurization.py'],
          outs: ['data/features'],
          params: ['featurize.max_features', 'featurize.ngrams']
        },
        prepare: {
          cmd: 'python src/prepare.py data/data.xml',
          deps: ['data/data.xml', 'src/prepare.py'],
          outs: ['data/prepared'],
          params: ['prepare.seed', 'prepare.split']
        },
        train: {
          cmd: 'python src/train.py data/features model.pkl',
          deps: ['data/features', 'src/train.py'],
          outs: ['model.pkl'],
          params: ['train.min_split', 'train.n_est', 'train.seed']
        }
      }
    } as PartialDvcYaml)

    expect(hasCheckpoints).toBe(false)
  })
})
