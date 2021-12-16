import { QuickPickOptions } from 'vscode'
import { definedAndNonEmpty } from '../../util/array'
import { quickPickValue } from '../../vscode/quickPick'
import { reportError } from '../../vscode/reporting'
import { MetricOrParam } from '../webview/contract'

export const pickFromMetricsAndParams = (
  metricsAndParams: MetricOrParam[] | undefined,
  quickPickOptions: QuickPickOptions
) => {
  if (!definedAndNonEmpty(metricsAndParams)) {
    return reportError('There are no params or metrics to select from')
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
