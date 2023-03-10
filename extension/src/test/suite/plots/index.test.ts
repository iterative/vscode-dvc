import { join } from 'path'
import merge from 'lodash.merge'
import cloneDeep from 'lodash.clonedeep'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy, stub } from 'sinon'
import { buildPlots } from '../plots/util'
import { Disposable } from '../../../extension'
import expShowFixtureWithoutErrors from '../../fixtures/expShow/base/noErrors'
import checkpointPlotsFixture from '../../fixtures/expShow/base/checkpointPlots'
import customPlotsFixture from '../../fixtures/expShow/base/customPlots'
import plotsDiffFixture from '../../fixtures/plotsDiff/output'
import multiSourcePlotsDiffFixture from '../../fixtures/plotsDiff/multiSource'
import templatePlotsFixture from '../../fixtures/plotsDiff/template'
import comparisonPlotsFixture from '../../fixtures/plotsDiff/comparison/vscode'
import plotsRevisionsFixture from '../../fixtures/plotsDiff/revisions'
import {
  bypassProcessManagerDebounce,
  closeAllEditors,
  getFirstArgOfLastCall,
  getMockNow,
  getMessageReceivedEmitter
} from '../util'
import { dvcDemoPath } from '../../util'
import {
  DEFAULT_SECTION_COLLAPSED,
  PlotsData as TPlotsData,
  Section,
  TemplatePlotGroup,
  TemplatePlotsData
} from '../../../plots/webview/contract'
import { TEMP_PLOTS_DIR } from '../../../cli/dvc/constants'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'
import { MessageFromWebviewType } from '../../../webview/contract'
import { reorderObjectList } from '../../../util/array'
import * as Telemetry from '../../../telemetry'
import { EventName } from '../../../telemetry/constants'
import {
  ExperimentStatus,
  EXPERIMENT_WORKSPACE_ID
} from '../../../cli/dvc/contract'
import { SelectedExperimentWithColor } from '../../../experiments/model'
import * as customPlotQuickPickUtil from '../../../plots/model/quickPick'

suite('Plots Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(function () {
    this.timeout(6000)
    disposable.dispose()
    return closeAllEditors()
  })

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('Plots', () => {
    it('should call plots diff once on instantiation with missing revisions if there are no plots', async () => {
      const { mockPlotsDiff, messageSpy, plots, data } = await buildPlots(
        disposable
      )

      const managedUpdateSpy = spy(data, 'managedUpdate')

      expect(mockPlotsDiff).to.be.calledOnce
      expect(mockPlotsDiff).to.be.calledWithExactly(
        dvcDemoPath,
        '1ba7bcd',
        '42b8736',
        '4fb124a',
        '53c3851',
        EXPERIMENT_WORKSPACE_ID
      )
      mockPlotsDiff.resetHistory()

      const webview = await plots.showWebview()
      await webview.isReady()

      expect(mockPlotsDiff).not.to.be.called
      expect(managedUpdateSpy).not.to.be.called

      expect(messageSpy).to.be.calledOnce
      expect(messageSpy).to.be.calledWithMatch({
        comparison: null,
        sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
        template: null
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should call plots diff with running experiment revisions but not checkpoints', async () => {
      const mockNow = getMockNow()
      const { mockPlotsDiff, data, experiments } = await buildPlots(
        disposable,
        plotsDiffFixture
      )
      mockPlotsDiff.resetHistory()

      const updatedExpShowFixture = merge(
        cloneDeep(expShowFixtureWithoutErrors),
        {
          '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77': {
            checkpoint: {
              data: {
                checkpoint_tip: 'experiment'
              }
            },
            experiment: {
              data: {
                checkpoint_tip: 'experiment',
                executor: 'dvc-task',
                name: 'exp-e1new',
                status: ExperimentStatus.RUNNING
              }
            }
          }
        }
      )

      const dataUpdateEvent = new Promise(resolve =>
        disposable.track(data.onDidUpdate(() => resolve(undefined)))
      )

      bypassProcessManagerDebounce(mockNow)
      void experiments.setState(updatedExpShowFixture)

      await dataUpdateEvent

      expect(mockPlotsDiff).to.be.calledOnce
      expect(mockPlotsDiff).to.be.calledWithExactly(
        dvcDemoPath,
        'experim',
        EXPERIMENT_WORKSPACE_ID
      )
    })

    it('should call plots diff with the branch name (if available) whenever the current commit changes', async () => {
      const mockNow = getMockNow()
      const { data, experiments, mockPlotsDiff } = await buildPlots(
        disposable,
        plotsDiffFixture
      )
      mockPlotsDiff.resetHistory()

      const committedExperiment = {
        baseline: merge(
          cloneDeep(
            expShowFixtureWithoutErrors[
              '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77'
            ]['4fb124aebddb2adf1545030907687fa9a4c80e70']
          ),
          { data: { name: 'main' } }
        )
      }

      const updatedExpShowFixture = {
        '9235a02880a0372545e5f7f4d79a5d9eee6331ac': committedExperiment,
        workspace: committedExperiment
      }

      const dataUpdateEvent = new Promise(resolve =>
        disposable.track(data.onDidUpdate(() => resolve(undefined)))
      )

      bypassProcessManagerDebounce(mockNow)
      void experiments.setState(updatedExpShowFixture)

      await dataUpdateEvent

      expect(mockPlotsDiff).to.be.calledOnce
      expect(mockPlotsDiff).to.be.calledWithExactly(
        dvcDemoPath,
        '9235a02',
        EXPERIMENT_WORKSPACE_ID
      )
    })

    it('should remove the temporary plots directory on dispose', async () => {
      const { mockRemoveDir, plots } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      plots.dispose()

      expect(mockRemoveDir).to.be.calledOnce
      expect(mockRemoveDir).to.be.calledWithExactly(
        join(dvcDemoPath, TEMP_PLOTS_DIR)
      )
    })

    it('should handle a set selected metrics message from the webview', async () => {
      const { plots, plotsModel, messageSpy } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetSelectedMetrics = spy(plotsModel, 'setSelectedMetrics')
      const mockSelectedMetrics = ['summary.json:loss']

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        payload: mockSelectedMetrics,
        type: MessageFromWebviewType.TOGGLE_METRIC
      })

      expect(mockSetSelectedMetrics).to.be.calledOnce
      expect(mockSetSelectedMetrics).to.be.calledWithExactly(
        mockSelectedMetrics
      )
      expect(messageSpy).to.be.calledOnce
      expect(
        messageSpy,
        "should update the webview's checkpoint plot state"
      ).to.be.calledWithExactly({
        checkpoint: {
          ...checkpointPlotsFixture,
          selectedMetrics: mockSelectedMetrics
        }
      })
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_METRICS_SELECTED,
        undefined,
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a section resized message from the webview', async () => {
      const { plots, plotsModel } = await buildPlots(disposable)

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetPlotSize = stub(plotsModel, 'setNbItemsPerRow').returns(
        undefined
      )

      mockMessageReceived.fire({
        payload: {
          height: undefined,
          nbItemsPerRow: 3,
          section: Section.TEMPLATE_PLOTS
        },
        type: MessageFromWebviewType.RESIZE_PLOTS
      })

      expect(mockSetPlotSize).to.be.calledOnce
      expect(mockSetPlotSize).to.be.calledWithExactly(Section.TEMPLATE_PLOTS, 3)
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_SECTION_RESIZED,
        {
          height: undefined,
          nbItemsPerRow: 3,
          section: Section.TEMPLATE_PLOTS
        },
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a section collapsed message from the webview', async () => {
      const { plots, plotsModel, messageSpy } = await buildPlots(disposable)

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetSectionCollapsed = spy(plotsModel, 'setSectionCollapsed')
      const mockSectionCollapsed = { [Section.CHECKPOINT_PLOTS]: true }

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        payload: mockSectionCollapsed,
        type: MessageFromWebviewType.TOGGLE_SECTION
      })

      expect(mockSetSectionCollapsed).to.be.calledOnce
      expect(mockSetSectionCollapsed).to.be.calledWithExactly(
        mockSectionCollapsed
      )
      expect(messageSpy).to.be.calledOnce
      expect(
        messageSpy,
        "should update the webview's section collapsed state"
      ).to.be.calledWithExactly({
        sectionCollapsed: {
          ...DEFAULT_SECTION_COLLAPSED,
          ...mockSectionCollapsed
        }
      })
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_SECTION_TOGGLE,
        mockSectionCollapsed,
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a comparison revisions reordered message from the webview', async () => {
      const { plots, plotsModel, messageSpy } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetComparisonOrder = spy(plotsModel, 'setComparisonOrder')
      const mockComparisonOrder = [
        '1ba7bcd',
        EXPERIMENT_WORKSPACE_ID,
        'main',
        '4fb124a',
        '42b8736'
      ]

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        payload: mockComparisonOrder,
        type: MessageFromWebviewType.REORDER_PLOTS_COMPARISON
      })

      expect(mockSetComparisonOrder).to.be.calledOnce
      expect(mockSetComparisonOrder).to.be.calledWithExactly(
        mockComparisonOrder
      )
      expect(messageSpy).to.be.calledOnce
      expect(
        messageSpy,
        "should update the webview's comparison revision state"
      ).to.be.calledWithExactly({
        comparison: {
          ...comparisonPlotsFixture,
          revisions: reorderObjectList(
            mockComparisonOrder,
            comparisonPlotsFixture.revisions,
            'revision'
          )
        }
      })
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_REVISIONS_REORDERED,
        undefined,
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a comparison rows reordered message from the webview', async () => {
      const { plots, pathsModel, messageSpy } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetComparisonPathsOrder = spy(
        pathsModel,
        'setComparisonPathsOrder'
      )
      const mockComparisonPathsOrder = [
        join('plots', 'acc.png'),
        join('plots', 'heatmap.png'),
        join('plots', 'loss.png')
      ]

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        payload: mockComparisonPathsOrder,
        type: MessageFromWebviewType.REORDER_PLOTS_COMPARISON_ROWS
      })

      expect(mockSetComparisonPathsOrder).to.be.calledOnce
      expect(mockSetComparisonPathsOrder).to.be.calledWithExactly(
        mockComparisonPathsOrder
      )
      expect(messageSpy).to.be.calledOnce
      expect(
        messageSpy,
        "should update the webview's comparison revision state"
      ).to.be.calledWithExactly({
        comparison: {
          ...comparisonPlotsFixture,
          plots: reorderObjectList(
            mockComparisonPathsOrder,
            comparisonPlotsFixture.plots,
            'path'
          )
        }
      })
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_COMPARISON_ROWS_REORDERED,
        undefined,
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a template plots reordered message from the webview', async () => {
      const { pathsModel, plots, messageSpy } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetTemplateOrder = spy(pathsModel, 'setTemplateOrder')
      const mockTemplateOrder = [
        { group: TemplatePlotGroup.MULTI_VIEW, paths: ['predictions.json'] },
        {
          group: TemplatePlotGroup.SINGLE_VIEW,
          paths: [join('logs', 'loss.tsv'), join('logs', 'acc.tsv')]
        }
      ]

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        payload: mockTemplateOrder,
        type: MessageFromWebviewType.REORDER_PLOTS_TEMPLATES
      })

      expect(mockSetTemplateOrder).to.be.calledOnce
      expect(mockSetTemplateOrder).to.be.calledWithExactly(mockTemplateOrder)
      expect(messageSpy).to.be.calledOnce
      expect(
        messageSpy,
        "should update the webview's template plot state"
      ).to.be.calledWithExactly({
        template: {
          ...templatePlotsFixture,
          plots: reorderObjectList(
            [TemplatePlotGroup.MULTI_VIEW, TemplatePlotGroup.SINGLE_VIEW],
            templatePlotsFixture.plots,
            'group'
          )
        }
      })
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_REORDER_PLOTS_TEMPLATES,
        undefined,
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a metric reordered message from the webview', async () => {
      const { plots, plotsModel, messageSpy } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetMetricOrder = spy(plotsModel, 'setMetricOrder')
      const mockMetricOrder = [
        'summary.json:loss',
        'summary.json:accuracy',
        'summary.json:val_loss',
        'summary.json:val_accuracy'
      ]

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        payload: mockMetricOrder,
        type: MessageFromWebviewType.REORDER_PLOTS_METRICS
      })

      expect(mockSetMetricOrder).to.be.calledOnce
      expect(mockSetMetricOrder).to.be.calledWithExactly(mockMetricOrder)
      expect(messageSpy).to.be.calledOnce
      expect(
        messageSpy,
        "should update the webview's checkpoint plot order state"
      ).to.be.calledWithExactly({
        checkpoint: {
          ...checkpointPlotsFixture,
          plots: reorderObjectList(
            mockMetricOrder,
            checkpointPlotsFixture.plots,
            'title'
          )
        }
      })
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_REORDER_PLOTS_METRICS,
        undefined,
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a plot zoomed message from the webview', async () => {
      const { plots } = await buildPlots(disposable, plotsDiffFixture)

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        type: MessageFromWebviewType.ZOOM_PLOT
      })

      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_ZOOM_PLOT,
        undefined,
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a custom plots reordered message from the webview', async () => {
      const { plots, plotsModel, messageSpy } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()

      const mockNewCustomPlotsOrder = [
        'custom-metrics:summary.json:accuracy-params:params.yaml:epochs',
        'custom-metrics:summary.json:loss-params:params.yaml:dropout'
      ]

      stub(plotsModel, 'getCustomPlots')
        .onFirstCall()
        .returns(customPlotsFixture)

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockSetCustomPlotsOrder = stub(plotsModel, 'setCustomPlotsOrder')
      mockSetCustomPlotsOrder.returns(undefined)

      messageSpy.resetHistory()

      mockMessageReceived.fire({
        payload: mockNewCustomPlotsOrder,
        type: MessageFromWebviewType.REORDER_PLOTS_CUSTOM
      })

      expect(mockSetCustomPlotsOrder).to.be.calledOnce
      expect(mockSetCustomPlotsOrder).to.be.calledWithExactly([
        {
          metric: 'metrics:summary.json:accuracy',
          param: 'params:params.yaml:epochs'
        },
        {
          metric: 'metrics:summary.json:loss',
          param: 'params:params.yaml:dropout'
        }
      ])
      expect(messageSpy).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_REORDER_PLOTS_CUSTOM,
        undefined,
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a select experiments message from the webview', async () => {
      const { plots, experiments } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const mockSelectExperiments = stub(
        experiments,
        'selectExperiments'
      ).resolves(undefined)

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        type: MessageFromWebviewType.SELECT_EXPERIMENTS
      })

      expect(mockSelectExperiments).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_SELECT_EXPERIMENTS,
        undefined,
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a select plots message from the webview', async () => {
      const { plots } = await buildPlots(disposable, plotsDiffFixture)

      const mockSelectExperiments = stub(plots, 'selectPlots').resolves(
        undefined
      )

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        type: MessageFromWebviewType.SELECT_PLOTS
      })

      expect(mockSelectExperiments).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_SELECT_PLOTS,
        undefined,
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a message to manually refresh a revision from the webview', async () => {
      const { data, plots, plotsModel, mockPlotsDiff } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const removeDataSpy = spy(plotsModel, 'setupManualRefresh')

      const webview = await plots.showWebview()
      mockPlotsDiff.resetHistory()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const dataUpdateEvent = new Promise(resolve =>
        data.onDidUpdate(() => resolve(undefined))
      )

      mockMessageReceived.fire({
        payload: 'main',
        type: MessageFromWebviewType.REFRESH_REVISION
      })

      await dataUpdateEvent

      expect(removeDataSpy).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_MANUAL_REFRESH,
        { revisions: 1 },
        undefined
      )
      expect(mockPlotsDiff).to.be.called
      expect(mockPlotsDiff).to.be.calledWithExactly(
        dvcDemoPath,
        '53c3851',
        EXPERIMENT_WORKSPACE_ID
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a message to manually refresh all visible plots from the webview', async () => {
      const { data, plots, mockPlotsDiff } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()
      mockPlotsDiff.resetHistory()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const dataUpdateEvent = new Promise(resolve =>
        data.onDidUpdate(() => resolve(undefined))
      )

      mockMessageReceived.fire({
        payload: [
          '1ba7bcd',
          '42b8736',
          '4fb124a',
          'main',
          EXPERIMENT_WORKSPACE_ID
        ],
        type: MessageFromWebviewType.REFRESH_REVISIONS
      })

      await dataUpdateEvent

      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_MANUAL_REFRESH,
        { revisions: 5 },
        undefined
      )
      expect(mockPlotsDiff).to.be.called
      expect(mockPlotsDiff).to.be.calledWithExactly(
        dvcDemoPath,
        '1ba7bcd',
        '42b8736',
        '4fb124a',
        '53c3851',
        EXPERIMENT_WORKSPACE_ID
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to make the plots webview visible', async () => {
      const { plots, messageSpy, mockPlotsDiff } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()
      await webview.isReady()

      expect(mockPlotsDiff).to.be.called

      const {
        checkpoint: checkpointData,
        comparison: comparisonData,
        sectionCollapsed,
        template: templateData
      } = getFirstArgOfLastCall(messageSpy)

      expect(checkpointData).to.deep.equal(checkpointPlotsFixture)
      expect(comparisonData).to.deep.equal(comparisonPlotsFixture)
      expect(sectionCollapsed).to.deep.equal(DEFAULT_SECTION_COLLAPSED)
      expect(templateData).to.deep.equal(templatePlotsFixture)

      const expectedPlotsData: TPlotsData = {
        checkpoint: checkpointPlotsFixture,
        comparison: comparisonPlotsFixture,
        custom: { height: undefined, nbItemsPerRow: 2, plots: [] },
        hasPlots: true,
        hasUnselectedPlots: false,
        sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
        selectedRevisions: plotsRevisionsFixture,
        template: templatePlotsFixture
      }

      expect(messageSpy).to.be.calledWith(expectedPlotsData)

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should send the correct data to the webview for flexible plots', async () => {
      const { experiments, plots, messageSpy, mockPlotsDiff } =
        await buildPlots(disposable, multiSourcePlotsDiffFixture)

      stub(experiments, 'getSelectedRevisions').returns([
        { label: EXPERIMENT_WORKSPACE_ID },
        { label: 'main' }
      ] as SelectedExperimentWithColor[])

      const webview = await plots.showWebview()
      await webview.isReady()

      expect(mockPlotsDiff).to.be.called

      const { template: templateData } = getFirstArgOfLastCall(messageSpy)

      const [singleViewSection, multiViewSection] = (
        templateData as TemplatePlotsData
      ).plots

      expect(
        singleViewSection.entries.map(({ id }: { id: string }) => id)
      ).to.deep.equal(['dvc.yaml::ROC', 'dvc.yaml::Precision-Recall'])

      const [roc] = singleViewSection.entries
      const rocDatapoints =
        (
          roc.content.data as {
            values: { rev: string; filename: string | undefined }[]
          }
        )?.values || []
      expect(rocDatapoints.length).to.be.greaterThan(0)
      for (const entry of rocDatapoints) {
        expect(entry.rev).not.to.contain('::')
        expect(entry.filename).not.to.be.undefined
      }

      expect(
        multiViewSection.entries.map(({ id }: { id: string }) => id)
      ).to.deep.equal(['dvc.yaml::Confusion-Matrix'])

      const expectedRevisions = [
        `main::${join('evaluation', 'test', 'plots', 'confusion_matrix.json')}`,
        `workspace::${join(
          'evaluation',
          'test',
          'plots',
          'confusion_matrix.json'
        )}`,
        `main::${join(
          'evaluation',
          'train',
          'plots',
          'confusion_matrix.json'
        )}`,
        `workspace::${join(
          'evaluation',
          'train',
          'plots',
          'confusion_matrix.json'
        )}`
      ].sort()

      const [confusionMatrix] = multiViewSection.entries

      const confusionMatrixDatapoints =
        (
          confusionMatrix.content.data as {
            values: { rev: string }[]
          }
        )?.values || []

      expect(confusionMatrixDatapoints.length).to.be.greaterThan(0)

      expect(confusionMatrix.revisions?.length).to.equal(4)
      expect(confusionMatrix.revisions?.sort()).to.deep.equal(expectedRevisions)

      for (const entry of confusionMatrixDatapoints) {
        expect(expectedRevisions).to.include(entry.rev)
      }
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a toggle experiment message from the webview', async () => {
      const { plots, experiments } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const mockSelectExperiments = stub(
        experiments,
        'toggleExperimentStatus'
      ).resolves(undefined)

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        payload: 'main',
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      })

      expect(mockSelectExperiments).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_EXPERIMENT_TOGGLE,
        undefined,
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a add custom plot message from the webview', async () => {
      const { plots, plotsModel } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()

      const mockGetMetricAndParam = stub(
        customPlotQuickPickUtil,
        'pickMetricAndParam'
      )

      const quickPickEvent = new Promise(resolve =>
        mockGetMetricAndParam.callsFake(() => {
          resolve(undefined)
          return Promise.resolve({
            metric: 'metrics:summary.json:loss',
            param: 'params:params.yaml:dropout'
          })
        })
      )

      const mockSetCustomPlotsOrder = stub(plotsModel, 'setCustomPlotsOrder')
      mockSetCustomPlotsOrder.returns(undefined)

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({ type: MessageFromWebviewType.ADD_CUSTOM_PLOT })

      await quickPickEvent

      expect(mockSetCustomPlotsOrder).to.be.calledWith([
        {
          metric: 'metrics:summary.json:loss',
          param: 'params:params.yaml:dropout'
        }
      ])
      expect(mockSendTelemetryEvent).to.be.calledWith(
        EventName.VIEWS_PLOTS_CUSTOM_PLOT_ADDED,
        undefined
      )
    })

    it('should handle a remove custom plot message from the webview', async () => {
      const { plots, plotsModel } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()

      const mockSelectCustomPlots = stub(
        customPlotQuickPickUtil,
        'pickCustomPlots'
      )

      const quickPickEvent = new Promise(resolve =>
        mockSelectCustomPlots.callsFake(() => {
          resolve(undefined)
          return Promise.resolve([
            'custom-metrics:summary.json:loss-params:params.yaml:dropout'
          ])
        })
      )

      stub(plotsModel, 'getCustomPlotsOrder').returns([
        {
          metric: 'metrics:summary.json:loss',
          param: 'params:params.yaml:dropout'
        }
      ])

      const mockSetCustomPlotsOrder = stub(plotsModel, 'setCustomPlotsOrder')
      mockSetCustomPlotsOrder.returns(undefined)

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        type: MessageFromWebviewType.REMOVE_CUSTOM_PLOTS
      })

      await quickPickEvent

      expect(mockSetCustomPlotsOrder).to.be.calledWith([])
      expect(mockSendTelemetryEvent).to.be.calledWith(
        EventName.VIEWS_PLOTS_CUSTOM_PLOT_REMOVED,
        undefined
      )
    })
  })
})
