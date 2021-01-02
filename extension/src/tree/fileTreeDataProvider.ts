import {
  Disposable,
  Event,
  EventEmitter,
  ExtensionContext,
  FileType,
  FileChangeEvent,
  FileChangeType,
  FileStat,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  Uri,
  window,
  workspace,
} from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as fileUtils from '../utils/fileUtils';
import { normalizeNFC } from '../utils/stringUtils';
import { ExtensionName } from '../constants';
import { FileInfo } from './fileInfo';
import { FileTreeItem } from './fileTreeNodes';

/**
 * DVC Data Files tree view data provider.
 */
class FileTreeDataProvider
  implements TreeDataProvider<FileTreeItem>, Disposable {
  private _disposables: Disposable[] = [];
  private _onDidChangeFile: EventEmitter<FileChangeEvent[]>;

  constructor() {
    this._onDidChangeFile = new EventEmitter<FileChangeEvent[]>();
  }

  get onDidChangeFile(): Event<FileChangeEvent[]> {
		return this._onDidChangeFile.event;
  }
  
  watch(uri: Uri, options: { recursive: boolean; excludes: string[]; }): Disposable {
    const watcher = fs.watch(uri.fsPath, { 
        recursive: options.recursive 
      }, 
      async (event: string, filename: string | Buffer) => {
			  const filepath = path.join(uri.fsPath, normalizeNFC(filename.toString()));
			  this._onDidChangeFile.fire([
          {
				    type: (event === 'change') ? FileChangeType.Changed : await fileUtils.exists(filepath) ? FileChangeType.Created : FileChangeType.Deleted,
				    uri: uri.with({ path: filepath })
          } as FileChangeEvent
        ]);
      }
    );
		return { dispose: () => watcher.close() };
  }

  dispose() {
    this._disposables.forEach((disposable) => disposable.dispose());
  }
  
  async getChildren(element?: FileTreeItem): Promise<FileTreeItem[]> {
		if (element) {
			const children = await this.readDirectory(element.uri);
			return children.map(([name, type]) => ({ uri: Uri.file(path.join(element.uri.fsPath, name)), type }));
		}

    if (workspace.workspaceFolders) {
		  const workspaceFolder = workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];
			const children = await this.readDirectory(workspaceFolder.uri);
			children.sort((a, b) => {
				if (a[1] === b[1]) {
					return a[0].localeCompare(b[0]);
				}
				return a[1] === FileType.Directory ? -1 : 1;
      });
      
			return children.map(([name, type]) => ({ uri: Uri.file(path.join(workspaceFolder.uri.fsPath, name)), type }));
    }

		return [];
	}

	getTreeItem(element: FileTreeItem): TreeItem {
		const treeItem = new TreeItem(element.uri, element.type === FileType.Directory ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);
		if (element.type === FileType.File) {
      treeItem.command = {
        command: 'vscode.open',
        title: 'Open File',
        arguments: [element.uri],
      };  
			treeItem.contextValue = 'file';
		}
		return treeItem;
  }
  
  async readDirectory(uri: Uri): Promise<[string, FileType][]> {
		const children = await fileUtils.readdir(uri.fsPath);
		const result: [string, FileType][] = [];
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const stat = await this.stat(path.join(uri.fsPath, child));
			result.push([child, stat.type]);
		}
		return Promise.resolve(result);
  }
  
  async stat(path: string): Promise<FileStat> {
		return new FileInfo(await fileUtils.stat(path));
	}
}

export function createFileTreeView(context: ExtensionContext) {
  const fileTreeDataProvider: FileTreeDataProvider = new FileTreeDataProvider();
  const fileTreeView: TreeView<FileTreeItem> = window.createTreeView(`${ExtensionName}.fileTreeView`, {
    showCollapseAll: true,
    treeDataProvider: fileTreeDataProvider,
    canSelectMany: false,
  });
  context.subscriptions.push(fileTreeView);
}
