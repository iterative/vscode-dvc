import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { commands } from 'vscode'
import { Disposable } from '../../../../extension'
import { Status } from '../../../../experiments/model'
import { buildPlots, getExpectedLivePlotsData } from '../util'
import { getFirstArgOfLastCall } from '../../util'
import { dvcDemoPath } from '../../../util'
import { RegisteredCommands } from '../../../../commands/external'
import { DEFAULT_SECTION_COLLAPSED } from '../../../../plots/webview/contract'
import livePlotsFixture from '../../../fixtures/expShow/livePlots'
import plotsDiffFixture from '../../../fixtures/plotsDiff/output'

suite('Plots Tree Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('PlotsTree', () => {
    const { colors } = livePlotsFixture
    const { domain, range } = colors

    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.plotsTree.focus')
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to toggle whether a revision is shown in the plots webview with dvc.views.plotsTree.toggleStatus', async () => {
      const { plots, plotsModel, messageSpy } = await buildPlots(
        disposable,
        plotsDiffFixture
      )

      const expectedDomain: string[] = []
      const expectedRange: string[] = []

      const domainCopy = [...domain]
      const rangeCopy = [...range]

      const mockGetLivePlots = stub(plotsModel, 'getLivePlots')
      const getLivePlotsEvent = new Promise(resolve =>
        mockGetLivePlots.callsFake(() => {
          resolve(undefined)
          return mockGetLivePlots.wrappedMethod.bind(plotsModel)()
        })
      )

      await plots.showWebview()
      await getLivePlotsEvent

      mockGetLivePlots.restore()

      expect(
        messageSpy,
        'when there are no revisions selected we send null (show empty state)'
      ).to.be.calledWith({
        comparison: null,
        live: null,
        sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
        static: null
      })
      messageSpy.resetHistory()

      while (domainCopy.length) {
        const name = domainCopy.pop() as string
        expectedDomain.unshift(name)
        expectedRange.unshift(rangeCopy.pop() as string)

        const selected = await commands.executeCommand(
          RegisteredCommands.REVISION_TOGGLE,
          {
            dvcRoot: dvcDemoPath,
            id: name
          }
        )

        expect(selected).to.equal(Status.SELECTED)

        const expectedData = getExpectedLivePlotsData(
          expectedDomain,
          expectedRange
        )

        const { live } = getFirstArgOfLastCall(messageSpy)

        expect(
          { live },
          'a message is sent with colors for the currently selected revisions'
        ).to.deep.equal(expectedData)
        messageSpy.resetHistory()
      }

      const name = expectedDomain.pop() as string
      expectedRange.pop()

      const unselected = await commands.executeCommand(
        RegisteredCommands.REVISION_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          id: name
        }
      )

      expect(unselected, 'the revision is now set back to unselected').to.equal(
        Status.UNSELECTED
      )

      const { live } = getFirstArgOfLastCall(messageSpy)

      const expectedData = getExpectedLivePlotsData(
        expectedDomain,
        expectedRange
      )

      expect(
        { live },
        'a message is sent with colors for the currently selected revisions'
      ).to.deep.equal(expectedData)
    }).timeout(12000)
  })
})
