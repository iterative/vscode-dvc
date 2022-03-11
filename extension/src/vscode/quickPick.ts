import { QuickPickOptions, QuickPickItem, window, QuickPick } from 'vscode'
import { Response } from './response'
import { Title } from './title'

export interface QuickPickItemWithValue<T = string> extends QuickPickItem {
  value: T
}

export interface QuickPickOptionsWithTitle extends QuickPickOptions {
  title?: Title
}

export const quickPickValue: <T = string>(
  items: QuickPickItemWithValue<T>[],
  options: Omit<QuickPickOptionsWithTitle, 'canPickMany'>
) => Thenable<T | undefined> = async (items, options) => {
  const result = await window.showQuickPick(items, {
    canPickMany: false,
    ...options
  })
  return result?.value
}

export const quickPickManyValues: <T = string>(
  items: QuickPickItemWithValue<T>[],
  options: Omit<QuickPickOptionsWithTitle, 'canPickMany'>
) => Thenable<T[] | undefined> = async (items, options = {}) => {
  const result = await window.showQuickPick(items, {
    ...options,
    canPickMany: true
  })

  return result?.map(item => item.value)
}

export const quickPickOne = (
  items: string[],
  placeHolder: string
): Thenable<string | undefined> =>
  window.showQuickPick(items, {
    canPickMany: false,
    placeHolder
  })

const createQuickPick = <T>(
  items: readonly QuickPickItemWithValue<T>[],
  selectedItems: readonly QuickPickItemWithValue<T>[] | undefined,
  options: { canSelectMany: boolean; placeholder?: string; title: Title }
): QuickPick<QuickPickItemWithValue<T>> => {
  const quickPick = window.createQuickPick<QuickPickItemWithValue<T>>()

  quickPick.canSelectMany = options.canSelectMany
  quickPick.placeholder = options.placeholder
  quickPick.title = options.title

  quickPick.items = items
  if (selectedItems) {
    quickPick.selectedItems = selectedItems
  }
  return quickPick
}

export const quickPickOneOrInput = (
  items: QuickPickItemWithValue[],
  options: { placeholder: string; defaultValue: string; title: Title }
): Promise<string | undefined> =>
  new Promise(resolve => {
    const quickPick = createQuickPick<string>(items, undefined, {
      canSelectMany: false,
      ...options
    })

    let selected: string | undefined
    quickPick.onDidChangeValue((text: string) => {
      selected = text
    })

    quickPick.onDidAccept(() => {
      const result =
        quickPick.activeItems?.[0]?.value || selected || options.defaultValue
      resolve(result)
      quickPick.dispose()
    })

    quickPick.onDidHide(() => {
      resolve(undefined)
      quickPick.dispose()
    })

    quickPick.show()
  })

const needsCollapse = <T>(
  quickPick: QuickPick<QuickPickItemWithValue<T>>,
  maxSelectedItems: number,
  selectedItems?: readonly QuickPickItemWithValue<T>[]
): boolean =>
  quickPick.items.length > maxSelectedItems &&
  (selectedItems || quickPick.selectedItems).length === maxSelectedItems

const collapse = <T>(
  quickPick: QuickPick<QuickPickItemWithValue<T>>,
  selectedItems = quickPick.selectedItems,
  activeItems = quickPick.activeItems
): void => {
  quickPick.items = selectedItems
  quickPick.selectedItems = selectedItems
  quickPick.activeItems = activeItems
}

const needsExpand = <T>(
  quickPick: QuickPick<QuickPickItemWithValue<T>>,
  maxSelectedItems: number,
  selectedItems: readonly QuickPickItemWithValue<T>[]
): boolean =>
  quickPick.items.length === maxSelectedItems &&
  selectedItems.length < maxSelectedItems

const expand = <T>(
  quickPick: QuickPick<QuickPickItemWithValue<T>>,
  items: readonly QuickPickItemWithValue<T>[],
  selectedItems: readonly QuickPickItemWithValue<T>[],
  activeItems: readonly QuickPickItemWithValue<T>[]
): void => {
  quickPick.items = items
  quickPick.selectedItems = selectedItems
  quickPick.activeItems = activeItems
}

const collapseOrExpand = <T>(
  quickPick: QuickPick<QuickPickItemWithValue<T>>,
  maxSelectedItems: number,
  items: readonly QuickPickItemWithValue<T>[],
  selectedItems: readonly QuickPickItemWithValue<T>[],
  activeItems = quickPick.activeItems
) => {
  if (needsCollapse(quickPick, maxSelectedItems, selectedItems)) {
    collapse(quickPick, selectedItems, activeItems)
  }
  if (needsExpand(quickPick, maxSelectedItems, selectedItems)) {
    expand(quickPick, items, selectedItems, activeItems)
  }
}

const limitSelected = <T>(
  quickPick: QuickPick<QuickPickItemWithValue<T>>,
  maxSelectedItems: number
) => {
  if (quickPick.items.length <= maxSelectedItems) {
    return
  }

  const items = [...quickPick.items]
  if (needsCollapse(quickPick, maxSelectedItems)) {
    collapse(quickPick)
  }

  quickPick.onDidChangeSelection(selectedItems =>
    collapseOrExpand(quickPick, maxSelectedItems, items, selectedItems)
  )
}

const isDefined = <T>(value: T): value is Exclude<T, undefined> => !!value

const collectResult = <T>(
  selectedItems: readonly QuickPickItemWithValue<T>[]
): Exclude<T, undefined>[] => {
  const acc: Exclude<T, undefined>[] = []

  for (const { value } of selectedItems) {
    if (!isDefined(value)) {
      continue
    }
    acc.push(value)
  }

  return acc
}

export const quickPickLimitedValues = <T>(
  items: QuickPickItemWithValue<T>[],
  selectedItems: readonly QuickPickItemWithValue<T>[],
  maxSelectedItems: number,
  title: Title
): Promise<Exclude<T, undefined>[] | undefined> =>
  new Promise(resolve => {
    const quickPick = createQuickPick(items, selectedItems, {
      canSelectMany: true,
      title
    })

    limitSelected<T>(quickPick, maxSelectedItems)

    quickPick.onDidAccept(() => {
      resolve(collectResult(quickPick.selectedItems))
      quickPick.dispose()
    })

    quickPick.onDidHide(() => {
      resolve(undefined)
      quickPick.dispose()
    })

    quickPick.show()
  })

export const quickPickYesOrNo = (
  descriptionYes: string,
  descriptionNo: string,
  options: { title: Title; placeHolder: string }
) =>
  quickPickValue<boolean>(
    [
      {
        description: descriptionYes,
        label: Response.YES,
        value: true
      },
      {
        description: descriptionNo,
        label: Response.NO,
        value: false
      }
    ],
    options
  )
