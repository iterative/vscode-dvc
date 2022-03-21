import { join } from 'path'
import merge from 'lodash.merge'
import cloneDeep from 'lodash.clonedeep'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, stub } from 'sinon'
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
  Section
} from '../../../plots/webview/contract'
import { TEMP_PLOTS_DIR } from '../../../cli/reader'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'
import { MessageFromWebviewType } from '../../../webview/contract'

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

    it('should be able to handle all of the messages that can be sent from the webview', async () => {
      const { plots, plotsModel } = await buildPlots(disposable)

      const webview = await plots.showWebview()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSelectedMetrics = ['some', 'selected', 'metrics']
      const mockSetSelectedMetrics = stub(
        plotsModel,
        'setSelectedMetrics'
      ).returns(undefined)

      mockMessageReceived.fire({
        payload: mockSelectedMetrics,
        type: MessageFromWebviewType.METRIC_TOGGLED
      })

      expect(mockSetSelectedMetrics).to.be.calledOnce
      expect(
        mockSetSelectedMetrics,
        'should correctly handle a metric toggled message'
      ).to.be.calledWithExactly(mockSelectedMetrics)

      const mockSetPlotSize = stub(plotsModel, 'setPlotSize').returns(undefined)

      mockMessageReceived.fire({
        payload: { section: Section.TEMPLATE_PLOTS, size: PlotSize.SMALL },
        type: MessageFromWebviewType.PLOTS_RESIZED
      })

      expect(mockSetPlotSize).to.be.calledOnce
      expect(
        mockSetPlotSize,
        'should correctly handle a section resized message'
      ).to.be.calledWithExactly(Section.TEMPLATE_PLOTS, PlotSize.SMALL)

      const mockSetSectionCollapsed = stub(
        plotsModel,
        'setSectionCollapsed'
      ).returns(undefined)

      mockMessageReceived.fire({
        payload: DEFAULT_SECTION_COLLAPSED,
        type: MessageFromWebviewType.PLOTS_SECTION_TOGGLED
      })

      expect(mockSetSectionCollapsed).to.be.calledOnce
      expect(
        mockSetSectionCollapsed,
        'should correctly handle a section collapsed message'
      ).to.be.calledWithExactly(DEFAULT_SECTION_COLLAPSED)

      const mockSetSectionName = stub(plotsModel, 'setSectionName').returns(
        undefined
      )

      const mockName = 'some cool section name'

      mockMessageReceived.fire({
        payload: { name: mockName, section: Section.TEMPLATE_PLOTS },
        type: MessageFromWebviewType.SECTION_RENAMED
      })

      expect(mockSetSectionName).to.be.calledOnce
      expect(
        mockSetSectionName,
        'should correctly handle a section rename message'
      ).to.be.calledWithExactly(Section.TEMPLATE_PLOTS, mockName)

      const mockSetComparisonOrder = stub(
        plotsModel,
        'setComparisonOrder'
      ).returns(undefined)

      const mockComparisonOrder = ['a', 'different', 'order']

      mockMessageReceived.fire({
        payload: mockComparisonOrder,
        type: MessageFromWebviewType.PLOTS_COMPARISON_REORDERED
      })

      expect(mockSetComparisonOrder).to.be.calledOnce
      expect(
        mockSetComparisonOrder,
        'should correctly handle a comparison revision reorder'
      ).to.be.calledWithExactly(mockComparisonOrder)
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
