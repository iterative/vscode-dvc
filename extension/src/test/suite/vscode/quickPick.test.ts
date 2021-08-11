import { describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { commands, window } from 'vscode'
import { quickPickOneOrInput } from '../../../vscode/quickPick'

suite('Quick Pick Test Suite', () => {
  window.showInformationMessage('Start all quick pick tests.')

  describe('quickPickOneOrInput', () => {
    it('should return the currently selected value', async () => {
      const expectedSelection = 'b'
      const items = [
        { description: 'a', label: 'a', value: 'a' },
        {
          description: expectedSelection,
          label: expectedSelection,
          value: expectedSelection
        }
      ]

      const resultPromise = quickPickOneOrInput(
        items,
        'pick the second item',
        'do not want this value'
      )

      await commands.executeCommand('workbench.action.quickOpenNavigateNext')
      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )

      const result = await resultPromise

      expect(result).to.equal(expectedSelection)
    })

    it('should return the default when no items are selected and no text is entered', async () => {
      const expectedDefault = 'want this value'

      const resultPromise = quickPickOneOrInput(
        [],
        'no items to pick from (get the default)',
        expectedDefault
      )

      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )

      const result = await resultPromise

      expect(result).to.equal(expectedDefault)
    })
  })
})
