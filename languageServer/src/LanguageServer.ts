import {
  TextDocuments,
  InitializeResult,
  ServerCapabilities,
  _Connection,
  TextDocumentPositionParams,
  CodeActionParams,
  DefinitionParams,
  CompletionParams
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { TextDocumentWrapper } from './TextDocumentWrapper'
import { documentSelector } from './documentSelector'
export class LanguageServer {
  private pythonFilePaths: string[] = []
  private documents!: TextDocuments<TextDocument>

  public listen(connection: _Connection) {
    this.documents = new TextDocuments(TextDocument)

    connection.onInitialize(() => this.onInitialize())

    connection.onDefinition(params => this.onDefinition(params))
    connection.onCompletion(params => this.onCompletion(params))
    connection.onCodeAction(params => this.onCodeAction(params))

    connection.onRequest('sendPythonFiles', (files: string[]) => {
      this.pythonFilePaths = files
    })

    this.documents.listen(connection)

    connection.listen()
  }

  private getDvcTextDocument(
    params: TextDocumentPositionParams | CodeActionParams
  ) {
    const uri = params.textDocument.uri
    const doc = this.documents.get(uri)

    if (!doc) {
      return null
    }
    return this.wrap(doc)
  }

  private wrap(doc: TextDocument) {
    return new TextDocumentWrapper(doc, this.pythonFilePaths)
  }

  private onCodeAction(params: CodeActionParams) {
    return this.getDvcTextDocument(params)?.getCodeActions(params) ?? null
  }

  private onCompletion(params: CompletionParams) {
    return this.getDvcTextDocument(params)?.getCompletions() ?? null
  }

  private onDefinition(params: DefinitionParams) {
    const document = this.getDvcTextDocument(params)
    const symbolUnderCursor = document?.symbolAt(params.position)

    if (symbolUnderCursor) {
      const allDocs = this.documents.all()
      const locationsAccumulator = []

      for (const txtDoc of allDocs) {
        const finder = this.wrap(txtDoc)
        const locations = finder.findLocationsFor(symbolUnderCursor)
        locationsAccumulator.push(...locations)
      }

      return locationsAccumulator ?? []
    }

    return null
  }

  private onInitialize() {
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
