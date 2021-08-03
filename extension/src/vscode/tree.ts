import { TreeDataProvider, TreeView, window } from 'vscode'

export const createTreeView = <T>(
  name: string,
  treeDataProvider: TreeDataProvider<string | T>
): TreeView<string | T> =>
  window.createTreeView<string | T>(name, {
    canSelectMany: true,
    showCollapseAll: true,
    treeDataProvider
  })
