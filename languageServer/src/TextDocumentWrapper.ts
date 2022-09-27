import { DocumentSymbol, Position, Location } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { parseDocument } from 'yaml'
import { ITextDocumentWrapper } from './ITextDocumentWrapper'
import { LanguageHelper } from './languageHelpers/baseLanguageHelper'
import { createLanguageHelper } from './languageHelpers'

export class TextDocumentWrapper implements ITextDocumentWrapper {
  uri: string

  private textDocument: TextDocument
  private languageHelper: LanguageHelper

  constructor(textDocument: TextDocument) {
    this.textDocument = textDocument
    this.uri = this.textDocument.uri
    this.languageHelper = createLanguageHelper(this.textDocument)
  }

  public offsetAt(position: Position) {
    return this.textDocument.offsetAt(position)
  }

  public getText() {
    return this.textDocument.getText()
  }

  public positionAt(offset: number) {
    return this.textDocument.positionAt(offset)
  }

  public getYamlDocument() {
    return parseDocument(this.getText())
  }

  public findLocationsFor(symbol: DocumentSymbol): Location[] {
    return this.languageHelper.findLocationsFor(symbol)
  }

  public symbolAt(position: Position): DocumentSymbol | undefined {
    return this.languageHelper.findSymbolAtPosition(position)
  }
}
