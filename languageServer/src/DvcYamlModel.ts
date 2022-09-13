import { inRange } from 'lodash'
import { Range } from 'vscode-languageserver/node'
import {
  Document,
  isMap,
  isNode,
  isScalar,
  isSeq,
  Pair,
  Scalar,
  YAMLMap,
  YAMLSeq
} from 'yaml'
import { ITextDocumentWrapper } from './ITextDocumentWrapper'
import { filePaths } from './regexes'

export interface JsonSerializable {
  toJSON(): JsonValue
}

export interface ICmd extends JsonSerializable {
  getReferencedFiles(): string[]
}

export interface IDvcYamlStage extends JsonSerializable {
  name: string
  cmd?: ICmd
  deps?: Set<string>
  parentDvcYaml: IDvcYamlModel
  presentIn(range: [number, number]): boolean
  addDependencies(items: string[]): void
}

export interface IDvcYamlModel {
  getYamlWithMissingDeps(range: Range): string | undefined
}

class Cmd implements ICmd {
  private cmd: Scalar | YAMLSeq

  constructor(cmd: Scalar | YAMLSeq) {
    this.cmd = cmd
  }

  static create(cmd: Scalar | YAMLSeq | undefined) {
    return cmd ? new Cmd(cmd) : undefined
  }

  public getReferencedFiles(): string[] {
    const paths: string[] = []

    if (isScalar(this.cmd)) {
      const value = this.cmd.value as string
      const matches = value.matchAll(filePaths)
      for (const match of matches) {
        paths.push(match[0])
      }
    }
    return paths
  }

  public toJSON(): JsonValue {
    return this.cmd.toJSON()
  }
}

class Stage implements IDvcYamlStage {
  name: string
  parentDvcYaml: IDvcYamlModel
  cmd?: ICmd
  deps?: Set<string>

  private pairNode: Pair

  constructor(pairNode: Pair, parentDvcYaml: IDvcYamlModel) {
    this.pairNode = pairNode
    this.parentDvcYaml = parentDvcYaml
    this.name = pairNode.key as string
    const value = pairNode.value

    isMap(value) && this.buildModel(value)
  }

  public toJSON(): JsonValue {
    let json: Record<string, JsonValue> = {}
    const nodeValue = this.pairNode.value

    if (isNode(nodeValue)) {
      json = {
        ...nodeValue.toJSON()
      }
    }

    if (this.cmd) {
      json.cmd = this.cmd.toJSON()
    }

    if (this.deps) {
      json.deps = [...this.deps]
    }

    return json
  }

  public addDependencies(items: string[]): void {
    this.deps = this.deps || new Set<string>()

    for (const item of items) {
      this.deps.add(item)
    }
  }

  public presentIn([start, end]: [number, number]): boolean {
    const valueNode = this.pairNode.value

    return !!(
      isNode(valueNode) &&
      valueNode.range &&
      (inRange(start, valueNode.range[0], valueNode.range[1]) ||
        inRange(end, valueNode.range[0], valueNode.range[1]))
    )
  }

  private buildModel(value: YAMLMap) {
    const cmdNode = value.getIn(['cmd'], true) as Scalar | YAMLSeq | undefined
    this.cmd = Cmd.create(cmdNode)

    const depsNode = value.getIn(['deps'], true) as YAMLSeq | undefined
    isSeq(depsNode) && this.buildDependencies(depsNode)
  }

  private buildDependencies(depsNode: YAMLSeq) {
    this.deps = new Set<string>()
    for (const item of depsNode.items) {
      if (isScalar(item)) {
        this.deps.add(item.value as string)
      }
    }
  }
}

export class DvcYaml implements IDvcYamlModel {
  private stages: IDvcYamlStage[] = []
  private document: ITextDocumentWrapper

  constructor(document: ITextDocumentWrapper) {
    this.document = document
    const yamlDoc = this.document.getYamlDocument()
    this.setStages(yamlDoc.get('stages', true))
  }

  public getYamlWithMissingDeps({ start, end }: Range): string | undefined {
    const yamlRange: [number, number] = [
      this.document.offsetAt(start),
      this.document.offsetAt(end)
    ]

    const stages = this.getStagesInside(yamlRange)

    const originalSrc = this.toString()

    for (const stage of stages) {
      const cmdFileReferences = stage.cmd?.getReferencedFiles()
      if (cmdFileReferences) {
        stage.addDependencies(cmdFileReferences)
      }
    }

    const newSrc = this.toString()

    if (newSrc === originalSrc) {
      return undefined
    }

    return newSrc
  }

  private getStagesInside(range: [number, number]): IDvcYamlStage[] {
    return this.stages.filter(stage => stage.presentIn(range))
  }

  private toString(): string {
    const stages: JsonValue = {}

    for (const stage of this.stages) {
      stages[stage.name] = stage.toJSON()
    }
    const model = {
      stages
    }

    return new Document(model).toString()
  }

  private setStages(node: unknown) {
    if (isMap(node)) {
      for (const pair of node.items) {
        this.stages.push(new Stage(pair, this))
      }
    }
  }
}

export type JsonValue = string | { [key: string]: JsonValue } | JsonValue[]
