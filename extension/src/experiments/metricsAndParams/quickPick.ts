import { definedAndNonEmpty } from '../../util/array'
import {
  QuickPickOptionsWithTitle,
  quickPickValue
} from '../../vscode/quickPick'
import { Toast } from '../../vscode/toast'
import { MetricOrParam } from '../webview/contract'

export const pickFromMetricsAndParams = (
  metricsAndParams: MetricOrParam[] | undefined,
  quickPickOptions: QuickPickOptionsWithTitle
) => {
  if (!definedAndNonEmpty(metricsAndParams)) {
    return Toast.showError('There are no params or metrics to select from')
  }
  return quickPickValue<MetricOrParam>(
    metricsAndParams.map(metricOrParam => ({
      description: metricOrParam.path,
      label: metricOrParam.name,
      value: metricOrParam
    })),
    quickPickOptions
  )
}
