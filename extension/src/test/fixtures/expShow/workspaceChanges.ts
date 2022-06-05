import { buildMetricOrParamPath } from '../../../experiments/columns/paths'
import { ColumnType } from '../../../experiments/webview/contract'
import { join } from '../../util/path'

const data = [
  buildMetricOrParamPath(ColumnType.DEPS, join('src', 'prepare.py')),
  'metrics:summary.json:accuracy',
  'metrics:summary.json:loss',
  'metrics:summary.json:val_accuracy',
  'metrics:summary.json:val_loss',
  'params:params.yaml:epochs',
  'params:params.yaml:learning_rate'
]

export default data
