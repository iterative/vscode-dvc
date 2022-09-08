import path, { relative } from 'path'
import { Uri, workspace } from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions
} from 'vscode-languageclient/node'
import { readFileSync } from 'fs-extra'
import { ServerModule } from './server-options'
import { Disposable } from '../class/dispose'
import { findFiles } from '../fileSystem/workspace'
import { getWorkspaceFolders } from '../vscode/workspaceFolders'

export class DVCLanguageClient extends Disposable {
  private client: LanguageClient

  constructor() {
    super()

    const clientOptions: LanguageClientOptions = {
      documentSelector: [
        {
          language: 'yaml'
        },
        {
          language: 'python'
        },
        {
          language: 'json'
        },
        {
          language: 'toml'
        }
      ],

      synchronize: {
        fileEvents: workspace.createFileSystemWatcher(
          '**/*.{yaml,dvc,dvc.lock,json,toml}'
        )
      }
    }

    this.client = new LanguageClient(
      'dvc-vscode-lsp',
      'DVC Language Server',
      new ServerModule().options,
      clientOptions
    )

    // Start the client. This will also launch the server
    this.dispose.track(this.start())
  }

  start() {
    this.client.start()
    findFiles('**/*.py', '.??*').then(files => {
      const [workspaceRoot] = getWorkspaceFolders()

      this.client.sendRequest(
        'sendPythonFiles',
        files.map(file => relative(workspaceRoot, file))
      )
    })

    findFiles('**/*.{yaml,toml,json}', '.??*').then(files => {
      this.client.sendRequest(
        'sendParamsFiles',
        files.map(file => {
          return {
            languageId: path.extname(file),
            text: readFileSync(file),
            uri: Uri.file(file).toString()
          }
        })
      )
    })

    return this
  }

  stop() {
    this.client.stop()
  }
}
