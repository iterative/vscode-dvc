import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy, stub } from 'sinon'
import { commands, TextDocument, Uri, window } from 'vscode'
import isEqual from 'lodash.isequal'
import { buildPlots } from '../plots/util'
import { Disposable } from '../../../extension'
import expShowFixtureWithoutErrors from '../../fixtures/expShow/base/noErrors'
import gitLogFixture from '../../fixtures/expShow/base/gitLog'
import rowOrderFixture from '../../fixtures/expShow/base/rowOrder'
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
  DEFAULT_PLOT_HEIGHT,
  DEFAULT_SECTION_COLLAPSED,
  PlotsData as TPlotsData,
  PlotsSection,
  TemplatePlotGroup,
  TemplatePlotsData,
  TemplatePlot,
  ImagePlot
} from '../../../plots/webview/contract'
import { TEMP_PLOTS_DIR } from '../../../cli/dvc/constants'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'
import { MessageFromWebviewType } from '../../../webview/contract'
import { reorderObjectList, uniqueValues } from '../../../util/array'
import * as Telemetry from '../../../telemetry'
import { EventName } from '../../../telemetry/constants'
import { SelectedExperimentWithColor } from '../../../experiments/model'
import { ErrorItem } from '../../../path/selection/tree'
import { isErrorItem } from '../../../tree'
import { RegisteredCommands } from '../../../commands/external'
import { REVISIONS } from '../../fixtures/plotsDiff'
import * as FileSystem from '../../../fileSystem'
import { ExpShowOutput, experimentHasError } from '../../../cli/dvc/contract'
import { COMMITS_SEPARATOR } from '../../../cli/git/constants'

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
      const { mockPlotsDiff, messageSpy, plots, data } = await buildPlots({
        disposer: disposable,
        plotsDiff: { data: {} }
      })

      const managedUpdateSpy = spy(data, 'managedUpdate')

      expect(mockPlotsDiff).to.be.calledOnce
      expect(mockPlotsDiff).to.be.calledWithExactly(
        dvcDemoPath,
        REVISIONS[0],
        REVISIONS[2],
        REVISIONS[3],
        REVISIONS[4],
        REVISIONS[1]
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

    it('should call plots diff with the commit whenever the current commit changes', async () => {
      const mockNow = getMockNow()
      const noExperimentFixture = expShowFixtureWithoutErrors.map(exp => ({
        ...exp,
        experiments: null
      }))

      const newCommit = '9235a02880a0372545e5f7f4d79a5d9eee6331ac'

      const { data, experiments, mockPlotsDiff } = await buildPlots({
        disposer: disposable,
        expShow: noExperimentFixture,
        plotsDiff: plotsDiffFixture
      })

      mockPlotsDiff.resetHistory()

      const updatedExpShowFixture = noExperimentFixture.map(exp => {
        if (exp.rev === '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77') {
          if (experimentHasError(exp)) {
            throw new Error('Experiment should not have error')
          }

          return {
            ...exp,
            data: {
              ...exp.data,
              rev: newCommit
            },
            rev: newCommit
          }
        }

        return exp
      })

      const dataUpdateEvent = new Promise(resolve =>
        disposable.track(data.onDidUpdate(() => resolve(undefined)))
      )

      bypassProcessManagerDebounce(mockNow)
      void experiments.setState({
        availableNbCommits: { main: 6 },
        expShow: updatedExpShowFixture as ExpShowOutput,
        gitLog: newCommit + COMMITS_SEPARATOR + gitLogFixture,
        rowOrder: [{ branch: 'main', sha: newCommit }, ...rowOrderFixture]
      })

      await dataUpdateEvent

      expect(mockPlotsDiff).to.be.calledOnce
      expect(mockPlotsDiff).to.be.calledWithExactly(
        dvcDemoPath,
        REVISIONS[0],
        REVISIONS[1]
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should remove the temporary plots directory on dispose', async () => {
      const { mockRemoveDir, plots } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      plots.dispose()

      expect(mockRemoveDir).to.be.calledOnce
      expect(mockRemoveDir).to.be.calledWithExactly(
        join(dvcDemoPath, TEMP_PLOTS_DIR)
      )
    })

    it('should handle a section resized message from the webview', async () => {
      const { plots, plotsModel } = await buildPlots({ disposer: disposable })

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetPlotSize = stub(
        plotsModel,
        'setNbItemsPerRowOrWidth'
      ).returns(undefined)

      mockMessageReceived.fire({
        payload: {
          height: DEFAULT_PLOT_HEIGHT,
          nbItemsPerRow: 3,
          section: PlotsSection.TEMPLATE_PLOTS
        },
        type: MessageFromWebviewType.RESIZE_PLOTS
      })

      expect(mockSetPlotSize).to.be.calledOnce
      expect(mockSetPlotSize).to.be.calledWithExactly(
        PlotsSection.TEMPLATE_PLOTS,
        3
      )
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_SECTION_RESIZED,
        {
          height: DEFAULT_PLOT_HEIGHT,
          nbItemsPerRow: 3,
          section: PlotsSection.TEMPLATE_PLOTS
        },
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a section collapsed message from the webview', async () => {
      const { plots, plotsModel, messageSpy } = await buildPlots({
        disposer: disposable
      })

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetSectionCollapsed = spy(plotsModel, 'setSectionCollapsed')
      const mockSectionCollapsed = { [PlotsSection.CUSTOM_PLOTS]: true }

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        payload: mockSectionCollapsed,
        type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
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
      const { plots, plotsModel, messageSpy } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetComparisonOrder = spy(plotsModel, 'setComparisonOrder')
      const mockComparisonOrder = [
        REVISIONS[2],
        REVISIONS[0],
        REVISIONS[3],
        REVISIONS[1],
        REVISIONS[4]
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
            'id'
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
      const { plots, pathsModel, messageSpy } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

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
      const { pathsModel, plots, messageSpy } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

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

    it('should handle a plot zoomed message from the webview', async () => {
      const { plots } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        type: MessageFromWebviewType.ZOOM_PLOT
      })

      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_ZOOM_PLOT,
        { isImage: false },
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a plot zoomed message from the webview for an image', async () => {
      const { plots } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })
      stub(FileSystem, 'openImageFileInEditor').resolves(true)

      const webview = await plots.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        payload: webview.getWebviewUri('a/path.jpg'),
        type: MessageFromWebviewType.ZOOM_PLOT
      })

      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_ZOOM_PLOT,
        { isImage: true },
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should open an image when receiving a plot zoomed message from the webview with a payload', async () => {
      const { plots } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      const webview = await plots.showWebview()
      const imagePath = 'some/path/image.jpg'

      stub(Telemetry, 'sendTelemetryEvent')
      const mockExecuteCommands = stub(commands, 'executeCommand')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        payload: webview.getWebviewUri(imagePath),
        type: MessageFromWebviewType.ZOOM_PLOT
      })

      expect(mockExecuteCommands).to.be.calledWith(
        'vscode.open',
        Uri.file(imagePath)
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle an export plot data as json message from the webview', async () => {
      const { plots } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      const webview = await plots.showWebview()
      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const customPlot = customPlotsFixture.plots[0]
      const mockShowSaveDialog = stub(window, 'showSaveDialog')
      const mockWriteJson = stub(FileSystem, 'writeJson')
      const mockOpenFile = stub(FileSystem, 'openFileInEditor')
      const exportFile = Uri.file('raw-data.json')
      const mockShowInformationMessage = stub(window, 'showErrorMessage')

      mockShowSaveDialog.resolves(exportFile)

      const fileCancelledEvent = new Promise(resolve =>
        mockShowSaveDialog.onFirstCall().callsFake(() => {
          resolve(undefined)
          return Promise.resolve(undefined)
        })
      )

      mockMessageReceived.fire({
        payload: customPlot.id,
        type: MessageFromWebviewType.EXPORT_PLOT_DATA_AS_JSON
      })

      await fileCancelledEvent

      expect(mockSendTelemetryEvent).not.to.be.called
      expect(mockWriteJson).not.to.be.called

      const jsonWriteErrorEvent = new Promise(resolve =>
        mockWriteJson.onFirstCall().callsFake(() => {
          resolve(undefined)
          throw new Error('file failed to write')
        })
      )

      mockMessageReceived.fire({
        payload: customPlot.id,
        type: MessageFromWebviewType.EXPORT_PLOT_DATA_AS_JSON
      })

      await jsonWriteErrorEvent

      expect(mockOpenFile).not.to.be.called
      expect(mockShowInformationMessage).to.be.called

      const openFileEvent = new Promise(resolve =>
        mockOpenFile.onFirstCall().callsFake(() => {
          resolve(undefined)
          return Promise.resolve(undefined as unknown as TextDocument)
        })
      )

      mockMessageReceived.fire({
        payload: customPlot.id,
        type: MessageFromWebviewType.EXPORT_PLOT_DATA_AS_JSON
      })

      await openFileEvent

      expect(mockWriteJson).to.be.calledWithExactly(
        exportFile.path,
        customPlot.values,
        true
      )
      expect(mockOpenFile).to.calledWithExactly(exportFile.path)
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_EXPORT_PLOT_DATA_AS_JSON,
        undefined,
        undefined
      )
    })

    it('should handle an export plot data as csv message from the webview', async () => {
      const { plots } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      const webview = await plots.showWebview()
      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockShowSaveDialog = stub(window, 'showSaveDialog')
      const mockWriteCsv = stub(FileSystem, 'writeCsv')
      const mockOpenFile = stub(FileSystem, 'openFileInEditor')
      const exportFile = Uri.file('raw-data.csv')
      const templatePlot = templatePlotsFixture.plots[0].entries[0]

      mockShowSaveDialog.resolves(exportFile)

      const fileCancelledEvent = new Promise(resolve =>
        mockShowSaveDialog.onFirstCall().callsFake(() => {
          resolve(undefined)
          return Promise.resolve(undefined)
        })
      )

      mockMessageReceived.fire({
        payload: templatePlot.id,
        type: MessageFromWebviewType.EXPORT_PLOT_DATA_AS_CSV
      })

      await fileCancelledEvent

      expect(mockSendTelemetryEvent).not.to.be.called
      expect(mockWriteCsv).not.to.be.called
      expect(mockOpenFile).not.to.be.called

      const openFileEvent = new Promise(resolve =>
        mockOpenFile.onFirstCall().callsFake(() => {
          resolve(undefined)
          return Promise.resolve(undefined as unknown as TextDocument)
        })
      )

      mockMessageReceived.fire({
        payload: templatePlot.id,
        type: MessageFromWebviewType.EXPORT_PLOT_DATA_AS_CSV
      })

      await openFileEvent

      expect(mockWriteCsv).to.be.calledWithExactly(
        exportFile.path,
        (templatePlot.content.data as { values: unknown[] }).values
      )
      expect(mockOpenFile).to.calledWithExactly(exportFile.path)
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_EXPORT_PLOT_DATA_AS_CSV,
        undefined,
        undefined
      )
    })

    it('should handle a custom plots reordered message from the webview', async () => {
      const { plots, plotsModel, messageSpy } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      const webview = await plots.showWebview()

      const mockNewCustomPlotsOrder = [
        'custom-summary.json:accuracy-params.yaml:epochs',
        'custom-summary.json:loss-params.yaml:dropout'
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
          metric: 'summary.json:accuracy',
          param: 'params.yaml:epochs'
        },
        {
          metric: 'summary.json:loss',
          param: 'params.yaml:dropout'
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
      const { plots, experiments } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      const mockSelectExperiments = stub(
        experiments,
        'selectExperimentsToPlot'
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
      const { plots } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

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

    it('should handle a message to manually refresh plot revisions from the webview', async () => {
      const mockNow = getMockNow()
      const { data, plots, mockPlotsDiff, messageSpy } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      messageSpy.restore()

      const webview = await plots.showWebview()
      mockPlotsDiff.resetHistory()
      const instanceMessageSpy = spy(webview, 'show')
      await webview.isReady()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const dataUpdateEvent = new Promise(resolve =>
        data.onDidUpdate(() => resolve(undefined))
      )

      bypassProcessManagerDebounce(mockNow)

      mockMessageReceived.fire({
        type: MessageFromWebviewType.REFRESH_REVISIONS
      })

      await dataUpdateEvent

      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWith(EventName.PLOTS_REFRESH)
      expect(mockPlotsDiff).to.be.called
      expect(mockPlotsDiff).to.be.calledWithExactly(
        dvcDemoPath,
        REVISIONS[0],
        REVISIONS[2],
        REVISIONS[3],
        REVISIONS[4],
        REVISIONS[1]
      )
      expect(
        instanceMessageSpy,
        'should call the plots webview with cached data before refreshing with data from the CLI'
      ).to.be.calledTwice
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to make the plots webview visible', async () => {
      const { plots, messageSpy, mockPlotsDiff } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      const webview = await plots.showWebview()
      await webview.isReady()

      expect(mockPlotsDiff).to.be.called

      const {
        comparison: comparisonData,
        custom: customData,
        sectionCollapsed,
        template: templateData,
        selectedRevisions: selectedRevisionsData
      } = getFirstArgOfLastCall(messageSpy)

      expect(comparisonData).to.deep.equal(comparisonPlotsFixture)
      expect(customData).to.deep.equal(customPlotsFixture)
      expect(sectionCollapsed).to.deep.equal(DEFAULT_SECTION_COLLAPSED)
      expect(templateData).to.deep.equal(templatePlotsFixture)
      expect(selectedRevisionsData).to.deep.equal(plotsRevisionsFixture)

      const expectedPlotsData: TPlotsData = {
        cliError: null,
        comparison: comparisonPlotsFixture,
        custom: customPlotsFixture,
        hasPlots: true,
        hasUnselectedPlots: false,
        sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
        selectedRevisions: plotsRevisionsFixture,
        template: templatePlotsFixture
      }

      expect(messageSpy).to.be.calledWithMatch(expectedPlotsData)

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it("should remove a revision's data if the revision is re-fetched and now contains an error", async () => {
      const accPngPath = join('plots', 'acc.png')
      const accPng = [
        ...plotsDiffFixture.data[join('plots', 'acc.png')]
      ] as ImagePlot[]
      const lossTsvPath = join('logs', 'loss.tsv')
      const lossTsv = [...plotsDiffFixture.data[lossTsvPath]] as TemplatePlot[]

      const plotsDiffOutput = {
        data: {
          [accPngPath]: accPng,
          [lossTsvPath]: lossTsv
        }
      }

      const brokenExp = REVISIONS[2]

      const reFetchedOutput = {
        data: {
          [accPngPath]: accPng.filter(
            ({ revisions }) => !isEqual(revisions, [brokenExp])
          ),
          [lossTsvPath]: lossTsv.map((plot, i) => {
            const datapoints = { ...lossTsv[i].datapoints }
            delete datapoints[brokenExp]

            return {
              ...plot,
              datapoints,
              revisions: lossTsv[i].revisions?.filter(rev => rev !== brokenExp)
            }
          })
        }
      }

      const { mockPlotsDiff, plots, data, plotsModel } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffOutput
      })

      await plots.isReady()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getExistingRevisions = (plotsModel: any) =>
        uniqueValues([
          ...Object.keys(plotsModel.revisionData),
          ...Object.keys(plotsModel.comparisonData)
        ])

      expect(getExistingRevisions(plotsModel)).to.contain(brokenExp)

      mockPlotsDiff.resetBehavior()
      mockPlotsDiff.resolves(reFetchedOutput)

      const dataUpdated = new Promise(resolve =>
        data.onDidUpdate(() => resolve(undefined))
      )

      await data.update()
      await dataUpdated

      expect(
        getExistingRevisions(plotsModel),
        'the revision should not exist in the underlying data'
      ).not.to.contain(brokenExp)
    })

    it('should send the correct data to the webview for flexible plots', async () => {
      const { experiments, plots, messageSpy, mockPlotsDiff } =
        await buildPlots({
          disposer: disposable,
          plotsDiff: multiSourcePlotsDiffFixture
        })

      stub(experiments, 'getSelectedRevisions').returns([
        { id: REVISIONS[0] },
        { id: REVISIONS[1] }
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
        `${REVISIONS[1]}::${join(
          'evaluation',
          'test',
          'plots',
          'confusion_matrix.json'
        )}`,
        `${REVISIONS[0]}::${join(
          'evaluation',
          'test',
          'plots',
          'confusion_matrix.json'
        )}`,
        `${REVISIONS[1]}::${join(
          'evaluation',
          'train',
          'plots',
          'confusion_matrix.json'
        )}`,
        `${REVISIONS[0]}::${join(
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
      expect([...(confusionMatrix.revisions || [])].sort()).to.deep.equal(
        expectedRevisions
      )

      for (const entry of confusionMatrixDatapoints) {
        expect(expectedRevisions).to.include(entry.rev)
      }
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a toggle experiment message from the webview', async () => {
      const { plots, experiments } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

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

    it('should handle an add custom plot message from the webview', async () => {
      const { plots } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      const webview = await plots.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const executeCommandSpy = spy(commands, 'executeCommand')

      mockMessageReceived.fire({
        type: MessageFromWebviewType.ADD_CUSTOM_PLOT
      })

      expect(executeCommandSpy).to.be.calledWithExactly(
        RegisteredCommands.PLOTS_CUSTOM_ADD,
        dvcDemoPath
      )
    })

    it('should handle a remove custom plot message from the webview', async () => {
      const { plots } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })

      const webview = await plots.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const executeCommandSpy = spy(commands, 'executeCommand')

      mockMessageReceived.fire({
        type: MessageFromWebviewType.REMOVE_CUSTOM_PLOTS
      })

      expect(executeCommandSpy).to.be.calledWithExactly(
        RegisteredCommands.PLOTS_CUSTOM_REMOVE,
        dvcDemoPath
      )
    })

    it('should handle an update smooth plot values message from the webview', async () => {
      const { plots, plotsModel } = await buildPlots({
        disposer: disposable,
        plotsDiff: plotsDiffFixture
      })
      const templatePlot = templatePlotsFixture.plots[0].entries[0]

      const webview = await plots.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockSetSmoothPlotValues = stub(plotsModel, 'setSmoothPlotValues')

      mockMessageReceived.fire({
        payload: {
          id: templatePlot.id,
          value: 0.5
        },
        type: MessageFromWebviewType.SET_SMOOTH_PLOT_VALUE
      })

      expect(mockSendTelemetryEvent).to.be.called
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_PLOTS_SET_SMOOTH_PLOT_VALUE,
        undefined,
        undefined
      )
      expect(mockSetSmoothPlotValues).to.be.called
      expect(mockSetSmoothPlotValues).to.be.calledWithExactly(
        templatePlot.id,
        0.5
      )
    })

    it('should handle the CLI throwing an error', async () => {
      const { data, errorsModel, mockPlotsDiff, plots, plotsModel } =
        await buildPlots({ disposer: disposable, plotsDiff: plotsDiffFixture })

      const mockErrorMsg = `'./dvc.yaml' is invalid.\n
    While parsing a flow sequence, in line 5, column 9
      5 │   │   [training/plots/metrics/train/acc.tsv: acc\n
    Did not find expected ',' or ']', in line 6, column 44
      6 │   │   training/plots/metrics/test/acc.tsv: acc]`

      await plots.isReady()

      mockPlotsDiff.resetBehavior()
      mockPlotsDiff.resolves({
        error: { msg: mockErrorMsg, type: 'caught error' }
      })

      await data.update()

      const errorItems = plots.getChildPaths(undefined) as ErrorItem[]

      expect(
        errorItems,
        'should return a single error item for the plots path tree'
      ).to.deep.equal([
        {
          error: mockErrorMsg,
          path: join(dvcDemoPath, './dvc.yaml is invalid.')
        }
      ])

      expect(
        errorsModel.getErrorPaths(plotsModel.getSelectedRevisionIds(), []),
        'should return the correct path to give the item a DecorationError'
      ).to.deep.equal(new Set([errorItems[0].path]))

      mockPlotsDiff.resetBehavior()
      mockPlotsDiff.resolves(plotsDiffFixture)

      await data.update()

      const selectionItems = plots.getChildPaths(undefined) as unknown[]

      expect(
        selectionItems.filter(item => isErrorItem(item)),
        'should not return any error items after the error is resolved'
      ).to.deep.equal([])

      expect(
        errorsModel.getErrorPaths(plotsModel.getSelectedRevisionIds(), []),
        'should no long provide decorations to the plots paths tree'
      ).to.deep.equal(new Set([]))
    })
  })
})
