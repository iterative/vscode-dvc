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
