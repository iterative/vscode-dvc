import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, SinonStub } from 'sinon'
import { commands, QuickPickItem, QuickPickOptions, window } from 'vscode'
import { Disposable } from '../../../../extension'
import { Status } from '../../../../experiments/model'
import { dvcDemoPath } from '../../util'
import { RegisteredCommands } from '../../../../commands/external'
import { buildPlots, getExpectedData } from '../../plots/util'
import livePlotsFixture from '../../../fixtures/expShow/livePlots'

suite('Experiments Tree Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('ExperimentsTree', () => {
    const { colors } = livePlotsFixture
    const ids = [
      '4fb124aebddb2adf1545030907687fa9a4c80e70',
      '42b8736b08170529903cd203a1f40382a4b4a8cd',
      '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d'
    ]
    const { domain, range } = colors

    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.experimentsTree.focus')
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to toggle whether an experiment is shown in the plots webview with dvc.views.experimentsTree.toggleStatus', async () => {
      const { plots, messageSpy } = await buildPlots(disposable)

      const expectedDomain = [...domain]
      const expectedRange = [...range]
      const expectedIds = [...ids]

      await plots.showWebview()

      while (expectedDomain.length) {
        expect(
          messageSpy,
          'a message is sent with colors for the currently selected experiments'
        ).to.be.calledWith(getExpectedData(expectedDomain, expectedRange))
        messageSpy.resetHistory()

        const id = expectedIds.pop()
        expectedDomain.pop()
        expectedRange.pop()

        const unSelected = await commands.executeCommand(
          RegisteredCommands.EXPERIMENT_TOGGLE,
          {
            dvcRoot: dvcDemoPath,
            id
          }
        )

        expect(unSelected).to.equal(Status.UNSELECTED)
      }

      expect(
        messageSpy,
        'when there are no experiments selected we send undefined (show empty state)'
      ).to.be.calledWith({
        live: undefined,
        static: undefined
      })
      messageSpy.resetHistory()

      expectedDomain.push(domain[0])
      expectedRange.push(range[0])

      const selected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          id: ids[0]
        }
      )

      expect(selected, 'the experiment is now selected').to.equal(
        Status.SELECTED
      )

      expect(messageSpy, 'we no longer send undefined').to.be.calledWith(
        getExpectedData(expectedDomain, expectedRange)
      )
    }).timeout(6000)

    it('should be able to select / de-select experiments using dvc.views.experimentsTree.selectExperiments', async () => {
      const { plots, messageSpy } = await buildPlots(disposable)

      const selectedId = ids[0]

      const selectedDisplayName = domain[0]
      const selectedColor = range[0]
      const selectedItem = {
        label: selectedDisplayName,
        picked: true,
        value: selectedId
      }

      await plots.showWebview()

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [
          items: readonly QuickPickItem[],
          options: QuickPickOptions & { canPickMany: true }
        ],
        Thenable<QuickPickItem[] | undefined>
      >
      mockShowQuickPick.resolves([selectedItem])

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SELECT)

      expect(mockShowQuickPick).to.be.calledOnce
      expect(mockShowQuickPick).to.be.calledWith(
        [
          {
            label: selectedDisplayName,
            picked: true,
            value: selectedId
          },
          {
            label: domain[1],
            picked: true,
            value: ids[1]
          },
          {
            label: domain[2],
            picked: true,
            value: ids[2]
          }
        ],
        { canPickMany: true, title: 'Select experiments' }
      )

      expect(
        messageSpy,
        'a message is sent with colors for the currently selected experiments'
      ).to.be.calledWith(
        getExpectedData([selectedDisplayName], [selectedColor])
      )
    }).timeout(6000)
  })
})
