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

export const quickPickOneOrInput = (
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
      const result =
        quickPick.activeItems?.[0]?.value || selected || defaultValue
      resolve(result)
      quickPick.dispose()
    })

    quickPick.onDidHide(() => {
      resolve(undefined)
      quickPick.dispose()
    })

    quickPick.show()
  })

const quickPickValueWithEvents = <T = string>(
  items: QuickPickItemWithValue<T>[],
  placeholder: string
): Promise<T | undefined> =>
  new Promise(resolve => {
    const quickPick = window.createQuickPick<QuickPickItemWithValue<T>>()

    quickPick.placeholder = placeholder
    quickPick.canSelectMany = false
    quickPick.items = items

    quickPick.onDidAccept(() => {
      resolve(quickPick.activeItems?.[0]?.value)
      quickPick.dispose()
    })

    quickPick.onDidHide(() => {
      resolve(undefined)
      quickPick.dispose()
    })

    quickPick.show()
  })

export const quickPickYesOrNo = (
  placeHolder: string,
  descriptionYes: string,
  descriptionNo: string
) =>
  quickPickValueWithEvents(
    [
      {
        description: descriptionYes,
        label: 'Yes',
        value: true
      },
      {
        description: descriptionNo,
        label: 'No',
        value: false
      }
    ],
    placeHolder
  )
