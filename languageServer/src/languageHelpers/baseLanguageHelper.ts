import { has } from 'lodash'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  DocumentSymbol,
  Position,
  Location,
  SymbolKind
} from 'vscode-languageserver/node'

export interface LanguageHelper {
  findSymbolAtPosition(position: Position): DocumentSymbol | undefined
  findLocationsFor(symbol: DocumentSymbol): Location[]
}

export abstract class BaseLanguageHelper<RootNode> implements LanguageHelper {
  protected textDocument: TextDocument
  protected rootNode?: RootNode

  constructor(textDocument: TextDocument) {
    this.textDocument = textDocument
    this.rootNode = this.parse(this.getText())
  }

  public findSymbolAtPosition(position: Position): DocumentSymbol | undefined {
    const cursorOffset: number = this.offsetAt(position)
    const symbolsAroundOffset = this.findEnclosingSymbols(cursorOffset)

    const symbolStack = symbolsAroundOffset.sort((a, b) => {
      const offA = this.offsetAt(a.range.end) - this.offsetAt(a.range.start)
      const offB = this.offsetAt(b.range.end) - this.offsetAt(b.range.start)

      return offB - offA // We want the tighter fits for last, so we can just pop them
    })

    return [...symbolStack].pop()
  }

  public findLocationsFor(symbol: DocumentSymbol): Location[] {
    if (symbol.kind === SymbolKind.Property) {
      return this.findLocationsForPropertySymbol(symbol)
    }

    return this.findLocationsForNormalSymbol(symbol)
  }

  protected getText() {
    return this.textDocument.getText()
  }

  protected offsetAt(position: Position) {
    return this.textDocument.offsetAt(position)
  }

  protected positionAt(offset: number) {
    return this.textDocument.positionAt(offset)
  }

  private findLocationsForPropertySymbol(symbol: DocumentSymbol) {
    const propertyPath = symbol.detail
    const itIsHere = propertyPath && this.hasProperty(propertyPath)

    if (itIsHere) {
      const pathArray = propertyPath.split('.')
      const location = this.getPropertyLocation(pathArray)

      return location ? [location] : []
    }

    return this.findLocationsForNormalSymbol(symbol)
  }

  private findLocationsForNormalSymbol(symbol: DocumentSymbol) {
    const parts = symbol.name.split(/\s/g)
    const txt = this.getText()

    const acc: Location[] = []
    for (const str of parts) {
      const index = txt.indexOf(str)
      if (index <= 0) {
        continue
      }
      const pos = this.positionAt(index)
      const range = this.findSymbolAtPosition(pos)?.range

      if (range) {
        acc.push(Location.create(this.textDocument.uri, range))
      }
    }
    return acc
  }

  private hasProperty(path: string) {
    const parsedObj = this.toJSON()

    return has(parsedObj, path)
  }

  protected abstract parse(source: string): RootNode | undefined
  protected abstract findEnclosingSymbols(offset: number): DocumentSymbol[]
  protected abstract getPropertyLocation(
    pathArray: Array<string | number>
  ): Location | null

  protected abstract toJSON(): unknown
}
