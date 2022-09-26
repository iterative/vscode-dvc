import {
  TextDocuments,
  InitializeResult,
  ServerCapabilities,
  _Connection,
  TextDocumentPositionParams,
  CodeActionParams,
  DefinitionParams,
  SymbolKind,
  Location,
  Position,
  Range,
  DocumentSymbol,
  TextDocumentItem
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'
import { TextDocumentWrapper } from './TextDocumentWrapper'

export class LanguageServer {
  private documentsKnownToEditor!: TextDocuments<TextDocument>
  private documentsFromDvcClient: TextDocumentWrapper[] = []
  private documentsCache: Record<string, TextDocumentWrapper> = {}

  public listen(connection: _Connection) {
    this.documentsKnownToEditor = new TextDocuments(TextDocument)

    connection.onInitialize(() => this.onInitialize())

    connection.onDefinition(params => {
      if (!params.textDocument.uri.endsWith('dvc.yaml')) {
        return null
      }

      return this.onDefinition(params)
    })

    connection.onRequest(
      'initialTextDocuments',
      (params: { textDocuments: TextDocumentItem[] }) => {
        this.documentsFromDvcClient = params.textDocuments.map(
          ({ uri, languageId, version, text: content }) => {
            const textDocument = TextDocument.create(
              uri,
              languageId,
              version,
              content
            )

            return this.wrap(textDocument)
          }
        )
      }
    )

    this.documentsKnownToEditor.listen(connection)

    connection.listen()
  }

  private getAllDocuments() {
    const openDocuments = this.documentsKnownToEditor.all()
    const acc: TextDocumentWrapper[] = openDocuments.map(doc => this.wrap(doc))

    for (const textDocument of this.documentsFromDvcClient) {
      const userAlreadyOpenedIt = this.documentsKnownToEditor.get(
        textDocument.uri
      )

      if (!userAlreadyOpenedIt) {
        acc.push(textDocument)
      }
    }

    return acc
  }

  private getDvcTextDocument(
    params: TextDocumentPositionParams | CodeActionParams
  ) {
    const uri = params.textDocument.uri
    const doc = this.documentsKnownToEditor.get(uri)

    if (!doc) {
      const alternative = this.documentsFromDvcClient.find(
        txtDoc => txtDoc.uri === uri
      )
      return alternative ?? null
    }

    return this.wrap(doc)
  }

  private wrap(doc: TextDocument) {
    if (!this.documentsCache[doc.uri]) {
      this.documentsCache[doc.uri] = new TextDocumentWrapper(doc)
    }

    return this.documentsCache[doc.uri]
  }

  private getFilePathLocations(
    symbolUnderCursor: DocumentSymbol,
    allDocs: TextDocumentWrapper[]
  ) {
    if (symbolUnderCursor.kind !== SymbolKind.File) {
      return []
    }

    const filePath = symbolUnderCursor.name

    const matchingFiles = allDocs.filter(doc =>
      URI.file(doc.uri).fsPath.endsWith(filePath)
    )

    return matchingFiles.map(doc => {
      const uri = doc.uri
      const start = Position.create(0, 0)
      const end = doc.positionAt(doc.getText().length - 1)
      const range = Range.create(start, end)

      return Location.create(uri, range)
    })
  }

  private getLocationsFromOtherDocuments(
    symbolUnderCursor: DocumentSymbol,
    allDocs: TextDocumentWrapper[]
  ) {
    const locationsAccumulator = []

    for (const txtDoc of allDocs) {
      const locations = txtDoc.findLocationsFor(symbolUnderCursor)
      locationsAccumulator.push(...locations)
    }

    return locationsAccumulator
  }

  private onDefinition(params: DefinitionParams) {
    const document = this.getDvcTextDocument(params)
    const symbolUnderCursor = document?.symbolAt(params.position)

    if (document && symbolUnderCursor) {
      const allDocs = this.getAllDocuments()
      const locationsAccumulator = []

      const fileLocations = this.getFilePathLocations(
        symbolUnderCursor,
        allDocs
      )

      locationsAccumulator.push(...fileLocations)

      const locationsFromOtherDocuments = this.getLocationsFromOtherDocuments(
        symbolUnderCursor,
        allDocs
      )

      locationsAccumulator.push(...locationsFromOtherDocuments)

      const externalLocations = locationsAccumulator.filter(
        location => location.uri !== document.uri
      )

      if (externalLocations.length > 0) {
        return this.arrayOrSingleResponse(externalLocations)
      }

      return this.arrayOrSingleResponse(locationsAccumulator)
    }

    return null
  }

  private arrayOrSingleResponse<T>(elements: T[]) {
    if (elements.length === 1) {
      return elements[0]
    }

    return elements
  }

  private onInitialize() {
    const serverCapabilities: ServerCapabilities = {
      definitionProvider: true
    }

    const result: InitializeResult = {
      capabilities: serverCapabilities
    }
    return result
  }
}
