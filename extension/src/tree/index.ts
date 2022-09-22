import {
  MarkdownString,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  Uri,
  window
} from 'vscode'
import { getMarkdownString } from '../vscode/markdownString'

export enum DecoratableTreeItemScheme {
  TRACKED = 'dvc.tracked',
  EXPERIMENTS = 'dvc.experiments'
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

export const getErrorTooltip = (msg: string): MarkdownString =>
  getMarkdownString(`$(error) ${msg}`)

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
  const item = new TreeItem(
    Uri.file(path),
    TreeItemCollapsibleState.Expanded
  ) as TreeItem
  item.id = path
  item.contextValue = 'dvcRoot'
  return item
}
