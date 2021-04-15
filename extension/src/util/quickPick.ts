import { QuickPickOptions, QuickPickItem, window } from 'vscode'

export interface QuickPickItemWithValue extends QuickPickItem {
  value: string
}

export const quickPickValue: (
  items: QuickPickItemWithValue[],
  options: Omit<QuickPickOptions, 'canPickMany'>
) => Thenable<string | undefined> = async (items, options) =>
  (await window.showQuickPick<QuickPickItemWithValue>(items, options))?.value

export const quickPickManyValues: (
  items: QuickPickItemWithValue[],
  options: Omit<QuickPickOptions, 'canPickMany'>
) => Thenable<string[] | undefined> = async (items, options = {}) =>
  (
    await window.showQuickPick<QuickPickItemWithValue>(items, {
      ...options,
      canPickMany: true
    })
  )?.map(item => item.value)
