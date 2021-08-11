import { QuickPickOptions, QuickPickItem, window } from 'vscode'

export interface QuickPickItemWithValue<T = string> extends QuickPickItem {
  value: T
}

export const quickPickValue: <T = string>(
  items: QuickPickItemWithValue<T>[],
  options: Omit<QuickPickOptions, 'canPickMany'>
) => Thenable<T | undefined> = async (items, options) =>
  (await window.showQuickPick(items, options))?.value

export const quickPickManyValues: <T = string>(
  items: QuickPickItemWithValue<T>[],
  options: Omit<QuickPickOptions, 'canPickMany'>
) => Thenable<T[] | undefined> = async (items, options = {}) =>
  (
    await window.showQuickPick(items, {
      ...options,
      canPickMany: true
    })
  )?.map(item => item.value)

export const quickPickOne = (
  items: string[],
  placeHolder: string
): Thenable<string | undefined> =>
  window.showQuickPick(items, {
    canPickMany: false,
    placeHolder
  })

export const quickPickOneWithInput = (
  items: QuickPickItemWithValue[],
  placeholder: string,
  defaultValue: string
): Promise<string | undefined> =>
  new Promise(resolve => {
    const quickPick = window.createQuickPick<QuickPickItemWithValue>()

    quickPick.placeholder = placeholder
    quickPick.canSelectMany = false
    quickPick.items = items

    let selected: string | undefined
    quickPick.onDidChangeValue((text: string) => {
      selected = text
    })

    quickPick.onDidAccept(() => {
      quickPick.dispose()
      resolve(quickPick.activeItems?.[0]?.value || selected || defaultValue)
    })

    quickPick.onDidHide(() => {
      quickPick.dispose()
      resolve(undefined)
    })

    quickPick.show()
  })
