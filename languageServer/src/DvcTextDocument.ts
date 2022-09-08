import {
  CompletionItem,
  DocumentSymbol,
  Position,
  SymbolKind,
  TextDocuments,
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
import { variableTemplates } from './regexes'
import { DvcYaml } from './DvcYamlModel'

type CompletionTemplateBody = string | { [key: string]: CompletionTemplateBody }
interface CompletionTemplate {
  label: string
  body: CompletionTemplateBody
}
export class DvcTextDocument {
  uri: string

  private textDocument: TextDocument
  private documents: TextDocuments<TextDocument>
  private pythonFilePaths?: string[]

  constructor(
    textDocument: TextDocument,
    documents: TextDocuments<TextDocument>,
    pythonFilePaths?: string[]
  ) {
    this.textDocument = textDocument
    this.documents = documents
    this.uri = this.textDocument.uri
    this.pythonFilePaths = pythonFilePaths
  }

  offsetAt(position: Position) {
    return this.textDocument.offsetAt(position)
  }

  getText() {
    return this.textDocument.getText()
  }

  positionAt(offset: number) {
    return this.textDocument.positionAt(offset)
  }

  getYamlDocument() {
    return parseDocument(this.getText())
  }

  getCompletions() {
    if (!this.uri.endsWith('dvc.yaml')) {
      return []
    }

    const completions: CompletionItem[] = []

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
    if (this.pythonFilePaths) {
      for (const path of this.pythonFilePaths) {
        completionTemplates.push({
          body: {
            cmd: `python ${path} $1`
          },
          label: `cmd: ${path}`
        })
      }
    }

    for (const { label, body } of completionTemplates) {
      const completionDocument: Document = new Document(body)
      const newSource = completionDocument.toString()
      const item = CompletionItem.create(label)
      item.insertTextFormat = InsertTextFormat.Snippet
      item.insertText = newSource
      completions.push(item)
    }

    return completions
  }

  yamlScalarNodeToDocumentSymbols(
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
      )
    ]

    const templates = nodeValue.matchAll(variableTemplates)
    for (const template of templates) {
      const expression = template[1]
      const expressionOffset: number = nodeStart + (template.index ?? 0) + 2 // To account for the '${'
      const symbols = expression.matchAll(/[\dA-Za-z]+/g)
      for (const templateSymbol of symbols) {
        const symbolStart = (templateSymbol.index ?? 0) + expressionOffset
        const symbolEnd = symbolStart + templateSymbol[0].length
        const symbolRange = Range.create(
          this.positionAt(symbolStart),
          this.positionAt(symbolEnd)
        )
        symbolsSoFar.push(
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

    return symbolsSoFar
  }

  calculateTextEdits(newText: string) {
    const currentText = this.getText()
    const edit = TextEdit.replace(
      Range.create(this.positionAt(0), this.positionAt(currentText.length)),
      newText
    )

    return [edit]
  }

  getCodeActions(params: CodeActionParams): CodeAction[] | null {
    if (!this.uri.endsWith('dvc.yaml')) {
      return null
    }

    const codeActions: CodeAction[] = []

    const model = new DvcYaml(this)
    const stage = model.getStageAt(params.range.start)
    if (stage?.cmd) {
      const filesUsed = stage.cmd.getReferencedFiles()
      const missingDeps = filesUsed.filter(path => !stage.deps?.has(path))

      if (missingDeps.length > 0) {
        stage.addDependencies(missingDeps)
        const yamlSource = stage.parentDvcYaml.toString()
        const textEdits = this.calculateTextEdits(yamlSource)

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
    }

    return codeActions
  }

  convertYamlRange(range: [number, number, number]) {
    const symbolStart = range[0]
    const symbolEnd = range[2]
    return Range.create(
      this.positionAt(symbolStart),
      this.positionAt(symbolEnd)
    )
  }

  yamlNodeToDocumentSymbols(
    node: Node | Pair,
    range: [number, number, number]
  ): DocumentSymbol[] {
    if (isNode(node)) {
      if (isScalar(node)) {
        return this.yamlScalarNodeToDocumentSymbols(node, range)
      }
    } else if (isPair(node)) {
      return this.yamlNodeToDocumentSymbols(node.value as Node | Pair, range)
    }

    return []
  }

  symbolScopeAt(position: Position): DocumentSymbol[] {
    const cursorOffset: number = this.offsetAt(position)

    const symbolsFound: Array<DocumentSymbol | null> = []

    visit(this.getYamlDocument(), (_key, node) => {
      if (isNode(node)) {
        const range = node.range
        if (!!range && cursorOffset >= range[0] && cursorOffset <= range[2]) {
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

  symbolAt(position: Position): DocumentSymbol | undefined {
    return this.symbolScopeAt(position).pop()
  }

  getTextDocuments() {
    return this.documents
  }

  createFinder(txtDoc: TextDocument) {
    return new DvcTextDocument(txtDoc, this.documents)
  }

  findLocationsFor(aSymbol: DocumentSymbol) {
    const parts = aSymbol.name.split(/\s/g)
    const txt = this.getText()

    return parts
      .map(str => txt.indexOf(str))
      .filter(index => index > 0)
      .map(index => this.positionAt(index))
      .map(pos => this.symbolAt(pos)?.range)
      .filter(Boolean)
      .map(range => Location.create(this.uri, range as Range))
  }

  getDefinitions(position: Position): Location[] {
    const theSymbol = this.symbolAt(position)
    if (theSymbol) {
      const allDocs = this.getTextDocuments().all()

      const locationsAccumulator = []

      for (const txtDoc of allDocs) {
        const finder = this.createFinder(txtDoc)
        const locations = finder.findLocationsFor(theSymbol)
        locationsAccumulator.push(...locations)
      }

      return locationsAccumulator ?? []
    }
    return []
  }
}
