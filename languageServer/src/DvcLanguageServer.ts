import {
  TextDocuments,
  InitializeResult,
  ServerCapabilities,
  _Connection,
  TextDocumentPositionParams,
  CodeActionParams,
  TextDocumentItem,
  InitializeParams,
  WorkspaceFolder
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { DvcTextDocument } from './DvcTextDocument'

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
export class DvcLanguageServer {
  private pythonFilePaths: string[] = []
  private paramFiles: Record<string, TextDocument> = {}
  private documents?: TextDocuments<TextDocument>
  private workspaceFolders: WorkspaceFolder[] = []

  public listen(connection: _Connection) {
    this.documents = new TextDocuments(TextDocument)

    connection.onInitialize(params => this.onInitialize(params))

    connection.onDefinition(params => {
      return (
        this.getDvcTextDocument(params)?.getDefinitions(params.position) ?? null
      )
    })

    connection.onCompletion(params => {
      return this.getDvcTextDocument(params)?.getCompletions() ?? null
    })

    connection.onCodeAction(params => {
      return this.getDvcTextDocument(params)?.getCodeActions(params) ?? null
    })

    connection.onRequest('sendPythonFiles', (files: string[]) => {
      this.pythonFilePaths = files
    })

    connection.onRequest('sendParamsFiles', (files: TextDocumentItem[]) => {
      const textDocs = files
        .filter(({ uri }) => !uri.endsWith('dvc.yaml'))
        .map(({ uri, languageId, text }) =>
          TextDocument.create(uri, languageId, 0, text)
        )

      for (const doc of textDocs) {
        this.paramFiles[doc.uri] = doc
      }
    })

    this.documents.listen(connection)

    connection.listen()
  }

  private getDvcTextDocument(
    params: TextDocumentPositionParams | CodeActionParams
  ) {
    if (!this.documents) {
      return null
    }
    const uri = params.textDocument.uri
    const doc = this.documents?.get(uri)

    if (!doc) {
      return null
    }

    const openParamDocs = this.documents
      ?.all()
      .filter(({ languageId }) => ['yaml', 'json', 'toml'].includes(languageId))

    for (const doc of openParamDocs) {
      this.paramFiles[doc.uri] = doc
    }

    return new DvcTextDocument(
      doc,
      this.documents,
      this.pythonFilePaths,
      Object.values(this.paramFiles),
      this.workspaceFolders
    )
  }

  private onInitialize(params: InitializeParams) {
    this.workspaceFolders = params.workspaceFolders ?? []

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
