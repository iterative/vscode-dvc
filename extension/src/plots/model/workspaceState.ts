import { Memento } from 'vscode'
import { MementoPrefix } from '../../vscode/memento'
import {
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NAMES,
  DEFAULT_SECTION_SIZES
} from '../webview/contract'

export const revive = (dvcRoot: string, workspaceState: Memento) => ({
  comparisonOrder: workspaceState.get(
    MementoPrefix.PLOT_COMPARISON_ORDER + dvcRoot,
    []
  ),
  metricOrder: workspaceState.get(
    MementoPrefix.PLOT_METRIC_ORDER + dvcRoot,
    []
  ),
  plotSizes: workspaceState.get(
    MementoPrefix.PLOT_SIZES + dvcRoot,
    DEFAULT_SECTION_SIZES
  ),
  sectionCollapsed: workspaceState.get(
    MementoPrefix.PLOT_SECTION_COLLAPSED + dvcRoot,
    DEFAULT_SECTION_COLLAPSED
  ),
  sectionNames: workspaceState.get(
    MementoPrefix.PLOT_SECTION_NAMES + dvcRoot,
    DEFAULT_SECTION_NAMES
  ),
  selectedMetrics: workspaceState.get(
    MementoPrefix.PLOT_SELECTED_METRICS + dvcRoot,
    undefined
  )
})
