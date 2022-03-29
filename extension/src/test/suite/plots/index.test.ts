import { join } from 'path'
import merge from 'lodash.merge'
import cloneDeep from 'lodash.clonedeep'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy, stub } from 'sinon'
import { buildPlots } from '../plots/util'
import { Disposable } from '../../../extension'
import expShowFixture from '../../fixtures/expShow/output'
import checkpointPlotsFixture from '../../fixtures/expShow/checkpointPlots'
import plotsDiffFixture from '../../fixtures/plotsDiff/output'
import templatePlotsFixture from '../../fixtures/plotsDiff/template'
import comparisonPlotsFixture from '../../fixtures/plotsDiff/comparison/vscode'
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
  PlotSize,
  Section,
  TemplatePlotGroup
} from '../../../plots/webview/contract'
import { TEMP_PLOTS_DIR } from '../../../cli/reader'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'
import { MessageFromWebviewType } from '../../../webview/contract'
import { reorderObjectList } from '../../../util/array'

suite('Plots Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(function () {
    this.timeout(5000)
    disposable.dispose()
    return closeAllEditors()
  })

  describe('Plots', () => {
    it('should call plots diff on instantiation with missing revisions', async () => {
      const { mockPlotsDiff } = await buildPlots(disposable)

      expect(mockPlotsDiff).to.be.calledOnce
      expect(mockPlotsDiff).to.be.calledWithExactly(
        dvcDemoPath,
        '1ba7bcd',
        '42b8736',
        '4fb124a',
        'main',
        'workspace'
      )
    })

    it('should call plots diff with new experiment revisions but not checkpoints', async () => {
      const mockNow = getMockNow()
      const { mockPlotsDiff, data, experiments } = await buildPlots(
        disposable,
        plotsDiffFixture
      )
      mockPlotsDiff.resetHistory()

      const updatedExpShowFixture = merge(cloneDeep(expShowFixture), {
        '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77': {
          checkpoint: {
            data: {
              checkpoint_tip: 'experiment',
              queued: false,
              running: false
            }
          },
          experiment: {
            data: {
              checkpoint_tip: 'experiment',
              name: 'exp-e1new',
              queued: false,
              running: true
            }
          }
        }
      })

      const dataUpdateEvent = new Promise(resolve =>
        disposable.track(data.onDidUpdate(() => resolve(undefined)))
      )

      bypassProcessManagerDebounce(mockNow)
      experiments.setState(updatedExpShowFixture)

      await dataUpdateEvent

      expect(mockPlotsDiff).to.be.calledOnce
      expect(mockPlotsDiff).to.be.calledWithExactly(dvcDemoPath, 'experim')
    })

    it('should call plots diff with the branch name whenever the current branch commit changes', async () => {
      const mockNow = getMockNow()
      const { data, experiments, mockPlotsDiff } = await buildPlots(
        disposable,
        plotsDiffFixture
      )
      mockPlotsDiff.resetHistory()

      const committedExperiment = {
        baseline: merge(
          cloneDeep(
            expShowFixture['53c3851f46955fa3e2b8f6e1c52999acc8c9ea77'][
              '4fb124aebddb2adf1545030907687fa9a4c80e70'
            ]
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
      experiments.setState(updatedExpShowFixture)

      await dataUpdateEvent

      expect(mockPlotsDiff).to.be.calledOnce
      expect(mockPlotsDiff).to.be.calledWithExactly(dvcDemoPath, 'main')
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
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSelectedMetrics = ['summary.json:loss']
      const mockSetSelectedMetrics = spy(plotsModel, 'setSelectedMetrics')

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        payload: mockSelectedMetrics,
        type: MessageFromWebviewType.METRIC_TOGGLED
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
    })

    it('should handle a section resized message from the webview', async () => {
      const { plots, plotsModel } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetPlotSize = stub(plotsModel, 'setPlotSize').returns(undefined)

      mockMessageReceived.fire({
        payload: { section: Section.TEMPLATE_PLOTS, size: PlotSize.SMALL },
        type: MessageFromWebviewType.PLOTS_RESIZED
      })

      expect(mockSetPlotSize).to.be.calledOnce
      expect(mockSetPlotSize).to.be.calledWithExactly(
        Section.TEMPLATE_PLOTS,
        PlotSize.SMALL
      )
    })

    it('should handle a section collapsed message from the webview', async () => {
      const { plots, plotsModel, messageSpy } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetSectionCollapsed = spy(plotsModel, 'setSectionCollapsed')
      const mockSectionCollapsed = { [Section.CHECKPOINT_PLOTS]: true }

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        payload: mockSectionCollapsed,
        type: MessageFromWebviewType.PLOTS_SECTION_TOGGLED
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
    })

    it('should handle a section rename message from the webview', async () => {
      const { plots, plotsModel } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetSectionName = stub(plotsModel, 'setSectionName').returns(
        undefined
      )

      const mockName = 'some cool section name'

      mockMessageReceived.fire({
        payload: { name: mockName, section: Section.TEMPLATE_PLOTS },
        type: MessageFromWebviewType.SECTION_RENAMED
      })

      expect(mockSetSectionName).to.be.calledOnce
      expect(mockSetSectionName).to.be.calledWithExactly(
        Section.TEMPLATE_PLOTS,
        mockName
      )
    })

    it('should handle a comparison revisions reordered message from the webview', async () => {
      const { plots, plotsModel, messageSpy } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetComparisonOrder = spy(plotsModel, 'setComparisonOrder')

      const mockComparisonOrder = [
        '1ba7bcd',
        'workspace',
        'main',
        '4fb124a',
        '42b8736'
      ]

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        payload: mockComparisonOrder,
        type: MessageFromWebviewType.PLOTS_COMPARISON_REORDERED
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
    })

    it('should handle a template plots reordered message from the webview', async () => {
      const { pathsModel, plots, messageSpy } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()
      await webview.isReady()

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
        type: MessageFromWebviewType.PLOTS_TEMPLATES_REORDERED
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
    })

    it('should handle a metric reordered message from the webview', async () => {
      const { plots, plotsModel, messageSpy } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const webview = await plots.showWebview()
      await webview.isReady()

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
        type: MessageFromWebviewType.PLOTS_METRICS_REORDERED
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
    }).timeout(WEBVIEW_TEST_TIMEOUT)
  })

  describe('showWebview', () => {
    it('should be able to make the plots webview visible', async () => {
      const { plots, plotsModel, messageSpy, mockPlotsDiff } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const mockGetCheckpointPlots = stub(plotsModel, 'getCheckpointPlots')
      const getCheckpointPlotsEvent = new Promise(resolve =>
        mockGetCheckpointPlots.callsFake(() => {
          resolve(undefined)
          return mockGetCheckpointPlots.wrappedMethod.bind(plotsModel)()
        })
      )

      const webview = await plots.showWebview()
      await getCheckpointPlotsEvent

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
        sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
        template: templatePlotsFixture
      }

      expect(messageSpy).to.be.calledWith(expectedPlotsData)

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    }).timeout(WEBVIEW_TEST_TIMEOUT)
  })
})
