import merge from 'lodash.merge'
import cloneDeep from 'lodash.clonedeep'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, stub } from 'sinon'
import { buildPlots } from '../plots/util'
import { Disposable } from '../../../extension'
import expShowFixture from '../../fixtures/expShow/output'
import livePlotsFixture from '../../fixtures/expShow/livePlots'
import plotsDiffFixture from '../../fixtures/plotsDiff/output'
import staticPlotsFixture from '../../fixtures/plotsDiff/static'
import comparisonPlotsFixture from '../../fixtures/plotsDiff/comparison/vscode'
import {
  bypassProcessManagerDebounce,
  closeAllEditors,
  getFirstArgOfLastCall,
  getMockNow
} from '../util'
import { dvcDemoPath } from '../../util'
import {
  defaultSectionCollapsed,
  PlotsData as TPlotsData
} from '../../../plots/webview/contract'

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
      expect(mockPlotsDiff).to.be.calledWith(
        dvcDemoPath,
        'main',
        '1ba7bcd',
        '42b8736',
        '4fb124a'
      )
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
  })

  describe('showWebview', () => {
    it('should be able to make the plots webview visible', async () => {
      const { plots, plotsModel, messageSpy, mockPlotsDiff } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const mockGetLivePlots = stub(plotsModel, 'getLivePlots')
      const getLivePlotsEvent = new Promise(resolve =>
        mockGetLivePlots.callsFake(() => {
          resolve(undefined)
          return mockGetLivePlots.wrappedMethod.bind(plotsModel)()
        })
      )

      const webview = await plots.showWebview()
      await getLivePlotsEvent

      expect(mockPlotsDiff).to.be.called

      const {
        comparison: comparisonData,
        live: liveData,
        sectionCollapsed,
        static: staticData
      } = getFirstArgOfLastCall(messageSpy)

      expect(comparisonData).to.deep.equal(comparisonPlotsFixture)
      expect(liveData).to.deep.equal(livePlotsFixture)
      expect(sectionCollapsed).to.deep.equal(defaultSectionCollapsed)
      expect(staticData).to.deep.equal(staticPlotsFixture)

      const expectedPlotsData: TPlotsData = {
        comparison: comparisonPlotsFixture,
        live: livePlotsFixture,
        sectionCollapsed: defaultSectionCollapsed,
        static: staticPlotsFixture
      }

      expect(messageSpy).to.be.calledWith(expectedPlotsData)

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    }).timeout(8000)
  })
})
