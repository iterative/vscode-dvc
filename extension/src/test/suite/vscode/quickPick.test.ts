import { describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { window } from 'vscode'
import { quickPickOneOrInput } from '../../../vscode/quickPick'
import { selectQuickPickItem } from '../util'

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

      const resultPromise = quickPickOneOrInput(items, {
        defaultValue: 'do not want this value',
        placeholder: 'pick the second item',
        title: 'just pick it'
      })

      await selectQuickPickItem(2)

      const result = await resultPromise

      expect(result).to.equal(expectedSelection)
    })

    it('should return the default when no items are selected and no text is entered', async () => {
      const expectedDefault = 'want this value'

      const resultPromise = quickPickOneOrInput([], {
        defaultValue: expectedDefault,
        placeholder: 'no items to pick from (get the default)',
        title: 'this is fun'
      })

      await selectQuickPickItem(1)

      const result = await resultPromise

      expect(result).to.equal(expectedDefault)
    })
  })
})
