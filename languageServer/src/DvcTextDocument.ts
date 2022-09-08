import { relative, parse } from 'path'
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
  TextEdit,
  WorkspaceFolder
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
import { URI } from 'vscode-uri'
import { variableTemplates } from './regexes'
import { DvcYaml } from './DvcYamlModel'

type CompletionTemplateBody =
  | string
  | { [key: string]: CompletionTemplateBody }
  | CompletionTemplateBody[]
interface CompletionTemplate {
  label: string
  body: CompletionTemplateBody
}
export class DvcTextDocument {
  uri: string

  private textDocument: TextDocument
  private documents: TextDocuments<TextDocument>
  private pythonFilePaths: string[]
  private paramFiles: TextDocument[]
  private workspaceFolders: WorkspaceFolder[] = []

  constructor(
    textDocument: TextDocument,
    documents: TextDocuments<TextDocument>,
    pythonFilePaths: string[],
    paramFiles: TextDocument[],
    workspaceFolders: WorkspaceFolder[]
  ) {
    this.textDocument = textDocument
    this.documents = documents
    this.uri = this.textDocument.uri
    this.pythonFilePaths = pythonFilePaths
    this.paramFiles = paramFiles
    this.workspaceFolders = workspaceFolders
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

  getCompletionTemplates() {
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
      },
      {
        body: {
          params: ['$1']
        },
        label: 'Params'
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

    const myPath = URI.parse(this.uri).fsPath
    const myDir = parse(myPath).dir

    for (const paramsDocument of this.paramFiles) {
      const relativePath = relative(myDir, URI.parse(paramsDocument.uri).fsPath)

      completionTemplates.push({
        body: [relativePath],
        label: relativePath
      })
    }

    return completionTemplates
  }

  getCompletions() {
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

  getTemplateExpressionSymbolsInsideScalar(
    scalarValue: string,
    nodeOffset: number
  ) {
    const templateSymbols: DocumentSymbol[] = []

    const templates = scalarValue.matchAll(variableTemplates)
    for (const template of templates) {
      const expression = template[1]
      const expressionOffset: number = nodeOffset + (template.index ?? 0) + 2 // To account for the '${'
      const symbols = expression.matchAll(/[\dA-Za-z]+/g)
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
      ),
      ...this.getTemplateExpressionSymbolsInsideScalar(nodeValue, nodeStart)
    ]

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

  convertYamlRange(yamlRange: [number, number, number]) {
    const symbolStart = yamlRange[0]
    const valueEnd = yamlRange[1]
    const symbolEnd = yamlRange[2]
    const range = Range.create(
      this.positionAt(symbolStart),
      this.positionAt(symbolEnd)
    )
    const selectionRange = Range.create(
      this.positionAt(symbolStart),
      this.positionAt(valueEnd)
    )

    return {
      range,
      selectionRange
    }
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
    return new DvcTextDocument(
      txtDoc,
      this.documents,
      this.pythonFilePaths,
      this.paramFiles,
      this.workspaceFolders
    )
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
