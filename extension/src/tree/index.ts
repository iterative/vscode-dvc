import {
  MarkdownString,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  Uri,
  window
} from 'vscode'
import { getMarkdownString } from '../vscode/markdownString'
import { RegisteredCommands } from '../commands/external'
import { hasKey } from '../util/object'

export enum DecoratableTreeItemScheme {
  EXPERIMENTS = 'dvc.experiments',
  PLOTS = 'dvc.plots',
  TRACKED = 'dvc.tracked'
}

export const getDecoratableUri = (
  label: string,
  scheme: DecoratableTreeItemScheme
): Uri => Uri.from({ path: label, scheme })

export const getDecoratableTreeItem = (
  label: string,
  scheme: DecoratableTreeItemScheme,
  collapsibleState = TreeItemCollapsibleState.None
): TreeItem => {
  const decoratableUri = getDecoratableUri(label, scheme)
  return new TreeItem(decoratableUri, collapsibleState)
}

type ErrorItem = { error: string }

export const isErrorItem = (
  maybeErrorItem: unknown
): maybeErrorItem is ErrorItem => hasKey(maybeErrorItem, 'error')

export const getErrorTooltip = (msg: string): MarkdownString =>
  getMarkdownString(`$(error) ${msg}`)

export const getCliErrorLabel = (msg: string): string =>
  msg.split('\n')[0].replace(/'|"/g, '')

export const getCliErrorTreeItem = (
  path: string,
  msg: string,
  decoratableTreeItemScheme: DecoratableTreeItemScheme
) => {
  const treeItem = getDecoratableTreeItem(path, decoratableTreeItemScheme)

  treeItem.tooltip = getErrorTooltip(msg)

  treeItem.iconPath = new ThemeIcon('blank')

  treeItem.command = {
    command: RegisteredCommands.EXTENSION_SHOW_OUTPUT,
    title: 'Show DVC Output'
  }
  return treeItem
}

export const isRoot = (element: unknown): element is string =>
  typeof element === 'string'

export const createTreeView = <T>(
  name: string,
  treeDataProvider: TreeDataProvider<string | T>,
  canSelectMany = false
): TreeView<string | T> =>
  window.createTreeView<string | T>(name, {
    canSelectMany,
    showCollapseAll: true,
    treeDataProvider
  })

export const getRootItem = (path: string): TreeItem => {
  const item = new TreeItem(Uri.file(path), TreeItemCollapsibleState.Expanded)
  item.id = path
  item.contextValue = 'dvcRoot'
  return item
}
