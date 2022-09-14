import {
  CompletionItem,
  DocumentSymbol,
  Position,
  SymbolKind,
  Range,
  Location,
  InsertTextFormat,
  CodeActionParams,
  CodeAction,
  CodeActionKind,
  WorkspaceEdit,
  TextEdit
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  isNode,
  isScalar,
  parseDocument,
  visit,
  Node,
  Document,
  Scalar,
  Pair,
  isPair
} from 'yaml'
import { alphadecimalWords, variableTemplates } from './regexes'
import { DvcYaml } from './DvcYamlModel'
import { ITextDocumentWrapper } from './ITextDocumentWrapper'

type CompletionTemplateBody = string | { [key: string]: CompletionTemplateBody }
interface CompletionTemplate {
  label: string
  body: CompletionTemplateBody
}
export class TextDocumentWrapper implements ITextDocumentWrapper {
  uri: string

  private textDocument: TextDocument
  private pythonFilePaths: string[] = []

  constructor(textDocument: TextDocument, pythonFilePaths?: string[]) {
    this.textDocument = textDocument
    this.uri = this.textDocument.uri
    this.pythonFilePaths = pythonFilePaths ?? []
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

  public getCompletions() {
    if (!this.uri.endsWith('dvc.yaml')) {
      return []
    }

    const completions: CompletionItem[] = []

    for (const { label, body } of this.getCompletionTemplates()) {
      const completionDocument: Document = new Document(body)
      const newSource = completionDocument.toString()
      const item = CompletionItem.create(label)
      item.insertTextFormat = InsertTextFormat.Snippet
      item.insertText = newSource
      completions.push(item)
    }

    return completions
  }

  public getCodeActions(params: CodeActionParams): CodeAction[] | null {
    if (!this.uri.endsWith('dvc.yaml')) {
      return null
    }

    const codeActions: CodeAction[] = []

    const model = new DvcYaml(this)
    const yamlWithExtraDeps = model.getYamlWithMissingDeps(params.range)
    if (yamlWithExtraDeps) {
      const textEdits = this.calculateTextEdits(yamlWithExtraDeps)

      const workspaceEdit: WorkspaceEdit = {
        changes: {
          [this.uri]: textEdits
        }
      }

      const codeAction = CodeAction.create(
        'Add cmd files as dependencies',
        workspaceEdit,
        CodeActionKind.RefactorRewrite
      )

      codeActions.push(codeAction)
    }

    return codeActions
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
      acc.push(Location.create(this.uri, range as Range))
    }
    return acc
  }

  public symbolAt(position: Position): DocumentSymbol | undefined {
    return this.symbolScopeAt(position).pop()
  }

  private getCompletionTemplates() {
    const completionTemplates: CompletionTemplate[] = [
      {
        body: {
          stages: { $1: { cmd: '$2' } }
        },
        label: 'stages'
      },
      {
        body: {
          $1: { cmd: '$2' }
        },
        label: 'Add stage'
      }
    ]
    for (const path of this.pythonFilePaths) {
      completionTemplates.push({
        body: {
          cmd: `python ${path} $1`
        },
        label: `cmd: ${path}`
      })
    }

    return completionTemplates
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
    const nodeValue = `${node.value}`

    const symbolsSoFar: DocumentSymbol[] = [
      DocumentSymbol.create(
        nodeValue,
        undefined,
        SymbolKind.String,
        Range.create(this.positionAt(nodeStart), this.positionAt(nodeEnd)),
        Range.create(this.positionAt(nodeStart), this.positionAt(valueEnd))
      ),
      ...this.getTemplateExpressionSymbolsInsideScalar(nodeValue, nodeStart)
    ]

    return symbolsSoFar
  }

  private calculateTextEdits(newText: string) {
    const currentText = this.getText()
    const edit = TextEdit.replace(
      Range.create(this.positionAt(0), this.positionAt(currentText.length)),
      newText
    )

    return [edit]
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
