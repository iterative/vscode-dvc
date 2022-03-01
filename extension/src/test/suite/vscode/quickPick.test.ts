import { window } from 'vscode'
import { restore, stub } from 'sinon'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { Disposable } from '../../../extension'
import {
  QuickPickItemWithValue,
  quickPickLimitedValues,
  quickPickOneOrInput
} from '../../../vscode/quickPick'
import { selectQuickPickItem } from '../util'

suite('Quick Pick Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

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

  describe('quickPickLimitedValues', () => {
    it('should limit the number of values that can be selected to the max selected items', async () => {
      const quickPick = window.createQuickPick<QuickPickItemWithValue<number>>()
      stub(window, 'createQuickPick').returns(quickPick)

      const maxSelectedItems = 3

      const items = [
        { label: 'A', value: 1 },
        { label: 'B', value: 2 },
        { label: 'C', value: 3 },
        { label: 'D', value: 4 },
        { label: 'E', value: 5 },
        { label: 'F', value: 6 },
        { label: 'G', value: 7 },
        { label: 'H', value: 8 },
        { label: 'I', value: 9 }
      ]

      const limitedItems = quickPickLimitedValues(
        items,
        items.slice(0, maxSelectedItems),
        maxSelectedItems,
        'select up to 3 values'
      )

      expect(
        quickPick.selectedItems,
        'the max number of items are selected'
      ).to.have.lengthOf(maxSelectedItems)
      expect(
        quickPick.items,
        'all items which could be selected are hidden'
      ).to.have.lengthOf(maxSelectedItems)

      const updateEvent = new Promise(resolve =>
        disposable.track(
          quickPick.onDidChangeSelection(selectedItems => {
            if (selectedItems.length < maxSelectedItems) {
              resolve(undefined)
            }
          })
        )
      )

      quickPick.selectedItems = items.slice(0, maxSelectedItems - 1)

      await updateEvent

      expect(
        quickPick.selectedItems,
        'less than the max number of items are selected'
      ).to.have.lengthOf.lessThan(maxSelectedItems)
      expect(
        quickPick.items,
        'the items are returned to their original state'
      ).to.deep.equal(items)

      quickPick.hide()

      expect(await limitedItems).to.be.undefined
    })
  })
})
