import { Disposable } from '@hediet/std/disposable'
import { scm, Uri, workspace } from 'vscode'

export class SourceControlManagement {
  public readonly dispose = Disposable.fn()

  constructor(private readonly workspaceFolders = workspace.workspaceFolders) {
    this.workspaceFolders = workspaceFolders
  }

  dvcScmFilesView(): void {
    this.workspaceFolders?.forEach(folder => {
      const uri = `${folder.uri.fsPath}/`

      const c = this.dispose.track(
        scm.createSourceControl('dvc', 'DVC', Uri.file(uri))
      )
      c.acceptInputCommand = {
        command: 'workbench.action.output.toggleOutput',
        title: 'foo'
      }

      c.inputBox.visible = false

      c.statusBarCommands = [
        {
          command: 'test',
          title: 'DVC'
        }
      ]

      const resourceGroup = this.dispose.track(
        c.createResourceGroup('group1', 'Unchanged')
      )

      resourceGroup.resourceStates = [
        {
          resourceUri: Uri.file(`${uri}path/file.ts`),
          command: {
            command: 'workbench.action.output.toggleOutput',
            title: 'group1-file1'
          },

          decorations: {
            strikeThrough: false
          }
        },
        {
          resourceUri: Uri.file(`${uri}path/file2.txt`),
          command: {
            command: 'workbench.action.output.toggleOutput',
            title: 'group1-file1'
          },
          decorations: {
            strikeThrough: false
          }
        },
        {
          resourceUri: Uri.file(`${uri}path/sub/file.txt`),
          command: {
            command: 'workbench.action.output.toggleOutput',
            title: 'group1-file1'
          },
          decorations: {
            strikeThrough: false
          }
        }
      ]
    })
  }
}
