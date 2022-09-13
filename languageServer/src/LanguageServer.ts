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
  private documents?: TextDocuments<TextDocument>

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
    if (!this.documents) {
      return null
    }
    const uri = params.textDocument.uri
    const doc = this.documents?.get(uri)

    if (!doc) {
      return null
    }
    return new TextDocumentWrapper(doc, this.documents, this.pythonFilePaths)
  }

  private onCodeAction(params: CodeActionParams) {
    return this.getDvcTextDocument(params)?.getCodeActions(params) ?? null
  }

  private onCompletion(params: CompletionParams) {
    return this.getDvcTextDocument(params)?.getCompletions() ?? null
  }

  private onDefinition(params: DefinitionParams) {
    return (
      this.getDvcTextDocument(params)?.getDefinitions(params.position) ?? null
    )
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
