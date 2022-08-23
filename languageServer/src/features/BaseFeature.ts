import * as JSONC from 'jsonc-parser'
import { JSONPath, JSONPathCallable, JSONPathOptions } from 'jsonpath-plus'
import {
  TextDocumentPositionParams,
  TextDocuments,
  _Connection
} from 'vscode-languageserver'
import { Position, TextDocument } from 'vscode-languageserver-textdocument'
import { parse } from 'yaml'

export interface Utilities {
  jsonQuery: JSONPathCallable
  findNodeAtLocation: typeof JSONC.findNodeAtLocation
  findNodeAtOffset: typeof JSONC.findNodeAtOffset
}

export interface TextResource<Schema> {
  uri: string
  text: string
  parsed?: Schema
}

export abstract class BaseFeature {
  protected connection?: _Connection

  protected documents?: TextDocuments<TextDocument>
  protected sandbox: Record<string, unknown> = {}

  private jsonWorkspace: {
    workspace: TextResource<unknown>[]
  } = {
    workspace: []
  }

  create(documents: TextDocuments<TextDocument>, connection: _Connection) {
    this.connection = connection
    this.documents = documents

    this.refreshWorkspace()
    this.setup()
  }

  protected setTextDocumentPositionParams(params: TextDocumentPositionParams) {
    this.sandbox.params = params
  }

  protected getValue<T>(key: string) {
    return this.sandbox[key] as T
  }

  protected getValues<A, B>(key1: string, key2: string) {
    return [this.sandbox[key1] as A, this.sandbox[key2] as B]
  }

  protected setValue(key: string, value: unknown) {
    this.sandbox[key] = value

    return this
  }

  protected queryWith(
    transformer: (
      utils: Utilities,
      data: Record<string, unknown>
    ) => Record<string, unknown>
  ): this {
    this.refreshWorkspace()
    this.refreshWorkspace()

    const accumulator: Record<string, unknown> = {
      ...this.jsonWorkspace,
      ...this.sandbox
    }

    this.sandbox = {
      ...this.sandbox,
      ...accumulator,
      ...transformer(
        {
          jsonQuery: JSONPath,
          findNodeAtLocation: JSONC.findNodeAtLocation,
          findNodeAtOffset: JSONC.findNodeAtOffset
        },
        { ...accumulator }
      )
    }

    return this
  }

  protected queryPaths(
    resultObj: { [key: string]: string },
    options: Partial<JSONPathOptions> = {}
  ): this {
    return this.query(resultObj, { resultType: 'path' })
  }

  protected query(
    resultObj: { [key: string]: string },
    options: Partial<JSONPathOptions> = {}
  ): this {
    this.refreshWorkspace()

    const accumulator: Record<string, unknown> = {
      ...this.jsonWorkspace,
      ...this.sandbox
    }

    for (const [alias, path] of Object.entries(resultObj)) {
      const result = JSONPath({
        path,
        json: { ...accumulator },
        ...options
      })

      accumulator[alias] = result
    }

    this.sandbox = {
      ...this.sandbox,
      ...accumulator
    }

    return this
  }

  protected normalizePath(path: string) {
    return JSONPath.toPathArray(path)
  }

  protected pathToRegex(path: string[]) {
    return new RegExp(path.join('[^]'), 'g')
  }

  protected dispose() {
    this.jsonWorkspace.workspace = []
    this.sandbox = {}
  }

  private refreshWorkspace() {
    const docs = this.documents?.all() || []

    for (const doc of docs) {
      this.readAndTryToParse(doc)
    }
  }

  private readAndTryToParse(doc: TextDocument) {
    const text = doc.getText()
    let parsed: unknown

    try {
      switch (doc.languageId) {
        case 'yaml':
          parsed = parse(text)
          break
        case 'json':
          parsed = JSON.parse(text)
          break
        default:
          parsed = this.genericParser(text)
          break
      }
    } catch (error) {
      this.connection?.console.error(error as string)
    }

    this.jsonWorkspace.workspace.push({
      uri: doc.uri,
      text,
      parsed
    })
  }

  private genericParser(src: string) {
    return {
      source: src
    }
  }

  protected abstract setup(): void
}
