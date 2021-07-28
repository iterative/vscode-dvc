import { QuickPickOptions, window } from 'vscode'
import { quickPickValue } from '../../vscode/quickPick'
import { ParamOrMetric } from '../webview/contract'

export const pickFromParamsAndMetrics = (
  paramsAndMetrics: ParamOrMetric[] | undefined,
  quickPickOptions: QuickPickOptions
) => {
  if (!paramsAndMetrics || paramsAndMetrics.length === 0) {
    window.showErrorMessage('There are no params or metrics to select from')
    return
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
