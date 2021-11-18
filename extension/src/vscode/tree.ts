import {
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  Uri,
  window
} from 'vscode'

export const createTreeView = <T>(
  name: string,
  treeDataProvider: TreeDataProvider<string | T>
): TreeView<string | T> =>
  window.createTreeView<string | T>(name, {
    canSelectMany: true,
    showCollapseAll: true,
    treeDataProvider
  })

export const getRootItem = (path: string): TreeItem => {
  const item = new TreeItem(Uri.file(path), TreeItemCollapsibleState.Expanded)
  item.id = path
  item.contextValue = 'dvcRoot'
  return item
}
