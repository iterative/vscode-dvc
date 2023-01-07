import {
  DocumentSymbol,
  Position,
  SymbolKind,
  Range,
  Location
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  isNode,
  isScalar,
  parseDocument,
  visit,
  Node,
  Scalar,
  Pair,
  isPair
} from 'yaml'
import { alphadecimalWords, variableTemplates } from './regexes'
import { ITextDocumentWrapper } from './ITextDocumentWrapper'

export class TextDocumentWrapper implements ITextDocumentWrapper {
  uri: string

  private textDocument: TextDocument

  constructor(textDocument: TextDocument) {
    this.textDocument = textDocument
    this.uri = this.textDocument.uri
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

  public findLocationsFor(aSymbol: DocumentSymbol) {
    const parts = aSymbol.name.split(/\s/g)
    const txt = this.getText()

    const acc: Location[] = []
    for (const str of parts) {
      const index = txt.indexOf(str)
      if (index <= 0) {
        continue
      }
      const pos = this.positionAt(index)
      const range = this.symbolAt(pos)?.range
      if (!range) {
        continue
      }
      acc.push(Location.create(this.uri, range))
    }
    return acc
  }

  public symbolAt(position: Position): DocumentSymbol | undefined {
    return this.symbolScopeAt(position).pop()
  }

  private getTemplateExpressionSymbolsInsideScalar(
    scalarValue: string,
    nodeOffset: number
  ) {
    const templateSymbols: DocumentSymbol[] = []

    const templates = scalarValue.matchAll(variableTemplates)
    for (const template of templates) {
      const expression = template[1]
      const expressionOffset: number = nodeOffset + (template.index ?? 0) + 2 // To account for the '${'
      const symbols = expression.matchAll(alphadecimalWords) // It works well for now. We can always add more sophistication when needed.

      for (const templateSymbol of symbols) {
        const symbolStart = (templateSymbol.index ?? 0) + expressionOffset
        const symbolEnd = symbolStart + templateSymbol[0].length
        const symbolRange = Range.create(
          this.positionAt(symbolStart),
          this.positionAt(symbolEnd)
        )
        templateSymbols.push(
          DocumentSymbol.create(
            templateSymbol[0],
            undefined,
            SymbolKind.Variable,
            symbolRange,
            symbolRange
          )
        )
      }
    }

    return templateSymbols
  }

  private yamlScalarNodeToDocumentSymbols(
    node: Scalar,
    [nodeStart, valueEnd, nodeEnd]: [number, number, number]
  ) {
    const nodeValue = `${node.value as string | number}`

    let symbolKind: SymbolKind = SymbolKind.String

    if (/\.[A-Za-z]+$/.test(nodeValue)) {
      symbolKind = SymbolKind.File
    }

    const symbolsSoFar: DocumentSymbol[] = [
      DocumentSymbol.create(
        nodeValue,
        undefined,
        symbolKind,
        Range.create(this.positionAt(nodeStart), this.positionAt(nodeEnd)),
        Range.create(this.positionAt(nodeStart), this.positionAt(valueEnd))
      ),
      ...this.getTemplateExpressionSymbolsInsideScalar(nodeValue, nodeStart)
    ]

    return symbolsSoFar
  }

  private yamlNodeToDocumentSymbols(
    node: Node | Pair,
    range: [number, number, number]
  ): DocumentSymbol[] {
    if (isScalar(node)) {
      return this.yamlScalarNodeToDocumentSymbols(node, range)
    }

    if (isPair(node)) {
      return this.yamlNodeToDocumentSymbols(node.value as Node | Pair, range)
    }

    return []
  }

  private symbolScopeAt(position: Position): DocumentSymbol[] {
    const cursorOffset: number = this.offsetAt(position)

    const symbolsFound: Array<DocumentSymbol | null> = []

    visit(this.getYamlDocument(), (_, node) => {
      if (isNode(node) && node.range) {
        const range = node.range
        const nodeStart = range[0]
        const nodeEnd = range[2]
        const isCursorInsideNode =
          cursorOffset >= nodeStart && cursorOffset <= nodeEnd

        if (isCursorInsideNode) {
          symbolsFound.push(...this.yamlNodeToDocumentSymbols(node, range))
        }
      }
    })
    const symbolStack = (symbolsFound.filter(Boolean) as DocumentSymbol[]).sort(
      (a, b) => {
        const offA = this.offsetAt(a.range.end) - this.offsetAt(a.range.start)
        const offB = this.offsetAt(b.range.end) - this.offsetAt(b.range.start)

        return offB - offA // We want the tighter fits for last, so we can just pop them
      }
    )

    return [...symbolStack]
  }
}
