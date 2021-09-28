import { QuickPickOptions } from 'vscode'
import { definedAndNonEmpty } from '../../util/array'
import { quickPickValue } from '../../vscode/quickPick'
import { reportError } from '../../vscode/reporting'
import { ParamOrMetric } from '../webview/contract'

export const pickFromParamsAndMetrics = (
  paramsAndMetrics: ParamOrMetric[] | undefined,
  quickPickOptions: QuickPickOptions
) => {
  if (!definedAndNonEmpty(paramsAndMetrics)) {
    return reportError('There are no params or metrics to select from')
  }
  return quickPickValue<ParamOrMetric>(
    paramsAndMetrics.map(paramOrMetric => ({
      description: paramOrMetric.path,
      label: paramOrMetric.name,
      value: paramOrMetric
    })),
    quickPickOptions
  )
}
