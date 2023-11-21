export enum PersistenceKey {
  EXPERIMENTS_BRANCHES = 'experimentsBranches:',
  EXPERIMENTS_FILTER_BY = 'experimentsFilterBy:',
  EXPERIMENTS_SORT_BY = 'experimentsSortBy:',
  EXPERIMENTS_STATUS = 'experimentsStatus:',
  EXPERIMENTS_STARS = 'experimentsStars:',
  METRICS_AND_PARAMS_COLUMN_ORDER = 'columnsColumnOrder:',
  METRICS_AND_PARAMS_COLUMN_WIDTHS = 'columnsColumnWidths:',
  METRICS_AND_PARAMS_STATUS = 'columnsStatus:',
  NUMBER_OF_COMMITS_TO_SHOW = 'numberOfCommitisToShow:',
  PLOT_PATH_STATUS = 'plotPathStatus:',
  PLOT_COMPARISON_ORDER = 'plotComparisonOrder:',
  PLOT_COMPARISON_PATHS_ORDER = 'plotComparisonPathsOrder',
  PLOT_HEIGHT = 'plotHeight',
  PLOT_METRIC_ORDER = 'plotMetricOrder:',
  PLOT_NB_ITEMS_PER_ROW_OR_WIDTH = 'plotNbItemsPerRowOrWidth:',
  PLOTS_CUSTOM_ORDER = 'plotCustomOrder:',
  PLOTS_HAS_CUSTOM_SELECTION = 'plotsCustomCollection:',
  PLOT_SECTION_COLLAPSED = 'plotSectionCollapsed:',
  PLOT_SELECTED_METRICS = 'plotSelectedMetrics:',
  PLOTS_SMOOTH_PLOT_VALUES = 'plotSmoothPlotValues:',
  PLOTS_COMPARISON_MULTI_PLOT_VALUES = 'plotComparisonMultiPlotValues:',
  PLOT_TEMPLATE_ORDER = 'plotTemplateOrder:',
  SHOW_ONLY_CHANGED = 'columnsShowOnlyChanged:'
}

export enum GlobalPersistenceKey {
  INSTALLED = 'dvc.installed'
}
