import { buildDepPath } from '../../../experiments/columns/paths'

const data = [
  buildDepPath('src', 'prepare.py'),
  'metrics:summary.json:accuracy',
  'metrics:summary.json:loss',
  'metrics:summary.json:val_accuracy',
  'metrics:summary.json:val_loss',
  'params:params.yaml:epochs',
  'params:params.yaml:learning_rate'
]

export default data
