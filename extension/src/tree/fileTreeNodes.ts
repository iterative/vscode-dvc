import {
  FileType,
  ThemeIcon,
  TreeItem,
  TreeItemCollapsibleState,
  Uri
} from 'vscode'

export interface FileTreeItem {
  uri: Uri
  type: FileType
}

export class FileNode extends TreeItem {
  constructor(public parentUri: Uri, public file: string) {
    super(file, TreeItemCollapsibleState.None)
    this.iconPath = ThemeIcon.File
    this.resourceUri = Uri.joinPath(parentUri, file)
    this.contextValue = 'dvc.file'
    this.command = {
      command: 'vscode.open',
      title: 'Open File',
      arguments: [this.resourceUri]
    }
  }
}

export class DirectoryNode extends TreeItem {
  constructor(public parentUri: Uri, public directory: string) {
    super(directory, TreeItemCollapsibleState.Collapsed)
    this.iconPath = ThemeIcon.Folder
    this.resourceUri = Uri.joinPath(parentUri, directory)
    this.contextValue = 'dvc.directory'
  }
}
