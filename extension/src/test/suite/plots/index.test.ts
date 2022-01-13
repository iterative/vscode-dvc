import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy } from 'sinon'
import { buildPlots } from '../plots/util'
import { Disposable } from '../../../extension'
import livePlotsFixture from '../../fixtures/expShow/livePlots'
import plotsShowFixture from '../../fixtures/plotsShow/output'
import staticPlotsFixture from '../../fixtures/plotsShow/staticPlots/vscode'
import { closeAllEditors } from '../util'
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

  describe('showWebview', () => {
    it('should be able to make the plots webview visible', async () => {
      const { data, plots, mockPlotsShow, messageSpy } = await buildPlots(
        disposable,
        plotsShowFixture
      )
      const managedUpdateSpy = spy(data, 'managedUpdate')

      const dataUpdatedEvent = new Promise(resolve =>
        disposable.track(data.onDidUpdate(() => resolve(undefined)))
      )

      const webview = await plots.showWebview()
      await dataUpdatedEvent

      const expectedPlotsData: TPlotsData = {
        live: livePlotsFixture,
        sectionCollapsed: defaultSectionCollapsed
      }

      expect(messageSpy).to.be.calledWith(expectedPlotsData)

      expect(mockPlotsShow).to.be.called
      expect(managedUpdateSpy, 'should call the cli when the webview is loaded')
        .to.be.calledOnce

      expect(messageSpy).to.be.calledWith({
        static: staticPlotsFixture
      })

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    }).timeout(8000)
  })
})
