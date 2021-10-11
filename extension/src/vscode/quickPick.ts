import { QuickPickOptions, QuickPickItem, window } from 'vscode'
import { Response } from './response'

export interface QuickPickItemWithValue<T = string> extends QuickPickItem {
  value: T
}

export const quickPickValue: <T = string>(
  items: QuickPickItemWithValue<T>[],
  options: Omit<QuickPickOptions, 'canPickMany'>
) => Thenable<T | undefined> = async (items, options) =>
  (await window.showQuickPick(items, { canPickMany: false, ...options }))?.value

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
  options: { placeholder: string; defaultValue: string; title: string }
): Promise<string | undefined> =>
  new Promise(resolve => {
    const quickPick = window.createQuickPick<QuickPickItemWithValue>()

    quickPick.placeholder = options.placeholder
    quickPick.canSelectMany = false
    quickPick.items = items
    quickPick.title = options.title

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

export const quickPickYesOrNo = (
  descriptionYes: string,
  descriptionNo: string,
  options: { title: string; placeHolder: string }
) =>
  quickPickValue<boolean>(
    [
      {
        description: descriptionYes,
        label: Response.yes,
        value: true
      },
      {
        description: descriptionNo,
        label: Response.no,
        value: false
      }
    ],
    options
  )
