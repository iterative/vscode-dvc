// import { dirname, join, relative } from 'path'
import {
  // commands,
  // Event,
  // EventEmitter,
  TreeDataProvider,
  TreeItem,
  // TreeItemCollapsibleState,
  // Uri,
  window
} from 'vscode'
// import { Disposable } from '@hediet/std/disposable'
// import { Config } from '../../config'
// import { definedAndNonEmpty } from '../../util/array'
// import { deleteTarget } from '../workspace'
// import { exists } from '..'
// import { CliExecutor } from '../../cli/executor'
// import { CliReader } from '../../cli/reader'
// import { getConfigValue, setConfigValue } from '../../vscode/config'
// import { tryThenMaybeForce } from '../../cli/actions'

export class ColumnsTree implements TreeDataProvider<string> {
  constructor() {
    window.registerTreeDataProvider('dvc.views.columnsTree', this)
  }

  public getTreeItem(): TreeItem {
    return new TreeItem('Test')
  }

  public getChildren(): Promise<string[]> {
    return Promise.resolve(['one', 'two', 'three'])
  }

  public initialize(): void {}
}
