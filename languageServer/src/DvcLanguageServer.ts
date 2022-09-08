import {
  TextDocuments,
  InitializeResult,
  ServerCapabilities,
  _Connection
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { DvcTextDocument } from './DvcTextDocument'

export class DvcLanguageServer {
  private pythonFilePaths: string[] = []

  public listen(connection: _Connection) {
    const documents: TextDocuments<TextDocument> = new TextDocuments(
      TextDocument
    )

    connection.onInitialize(() => this.onInitialize())

    connection.onDefinition(params => {
      const uri = params.textDocument.uri
      const doc = documents.get(uri)

      if (!doc) {
        return null
      }
      const dvcDoc = new DvcTextDocument(doc, documents)
      return dvcDoc.getDefinitions(params.position)
    })

    connection.onCompletion(params => {
      const uri = params.textDocument.uri
      const doc = documents.get(uri)

      if (!doc) {
        return null
      }
      const dvcDoc = new DvcTextDocument(doc, documents, this.pythonFilePaths)
      return dvcDoc.getCompletions()
    })

    connection.onCodeAction(params => {
      const uri = params.textDocument.uri
      const doc = documents.get(uri)

      if (!doc) {
        return null
      }
      const dvcDoc = new DvcTextDocument(doc, documents, this.pythonFilePaths)
      return dvcDoc.getCodeActions(params)
    })

    connection.onRequest('sendPythonFiles', (files: string[]) => {
      this.pythonFilePaths = files
    })

    documents.listen(connection)

    connection.listen()
  }

  private onInitialize() {
    const documentSelector = [
      {
        language: 'yaml'
      },
      {
        pattern: '**/*.{dvc,dvc.lock}'
      },
      {
        language: 'json'
      },
      {
        language: 'toml'
      },
      {
        language: 'python'
      }
    ]

    const serverCapabilities: ServerCapabilities = {
      codeActionProvider: true,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: ['.', ':', '/', '-']
      },
      declarationProvider: {
        documentSelector
      },
      definitionProvider: true
    }

    const result: InitializeResult = {
      capabilities: serverCapabilities
    }
    return result
  }
}
