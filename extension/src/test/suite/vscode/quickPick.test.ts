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
import { Title } from '../../../vscode/title'

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
        title: 'just pick it' as Title
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
        title: 'this is fun' as Title
      })

      await selectQuickPickItem(1)

      const result = await resultPromise

      expect(result).to.equal(expectedDefault)
    })
  })

  describe('quickPickLimitedValues', () => {
    it('should limit the number of values that can be selected to the max selected items', async () => {
      const quickPick = disposable.track(
        window.createQuickPick<QuickPickItemWithValue<number>>()
      )
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
        'select up to 3 values' as Title
      )

      expect(
        quickPick.selectedItems,
        'the max number of items are selected'
      ).to.have.lengthOf(maxSelectedItems)
      expect(
        quickPick.items,
        'all items which could be selected are hidden'
      ).to.have.lengthOf(maxSelectedItems)

      quickPick.hide()

      expect(await limitedItems).to.be.undefined
    })

    it('should show all items when less than the max number of items are selected', () => {
      const quickPick = disposable.track(
        window.createQuickPick<QuickPickItemWithValue<number>>()
      )
      stub(window, 'createQuickPick').returns(quickPick)

      const maxSelectedItems = 5

      const items = [
        { label: 'J', value: 1 },
        { label: 'K', value: 2 },
        { label: 'L', value: 3 },
        { label: 'M', value: 4 },
        { label: 'N', value: 5 },
        { label: 'O', value: 6 },
        { label: 'P', value: 7 },
        { label: 'Q', value: 8 },
        { label: 'R', value: 9 }
      ]

      quickPickLimitedValues(
        items,
        items.slice(0, maxSelectedItems - 1),
        maxSelectedItems,
        'select up to 5 values' as Title
      )

      expect(
        quickPick.selectedItems,
        'less than the max number of items are selected'
      ).to.have.lengthOf.lessThan(maxSelectedItems)
      expect(quickPick.items, 'all items are shown').to.deep.equal(items)
    })
  })
})
