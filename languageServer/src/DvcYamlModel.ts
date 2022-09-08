import { inRange } from 'lodash'
import { Position } from 'vscode-languageserver/node'
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
import { IDvcTextDocument } from './IDvcTextDocument'

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
  contains(offset: number): boolean
  dependsOnAll(items: string[]): boolean
  addDependencies(items: string[]): void
  addParams(items: string[]): void
  clone(): IDvcYamlStage
}

export interface IDvcYamlModel {
  getStageAt(position: Position): IDvcYamlStage | undefined
  toString(): string
  clone(): IDvcYamlModel
}

export class Cmd implements ICmd {
  private cmd: Scalar | YAMLSeq

  constructor(cmd: Scalar | YAMLSeq) {
    this.cmd = cmd
  }

  static create(cmd: Scalar | YAMLSeq | undefined) {
    return cmd ? new Cmd(cmd) : undefined
  }

  getReferencedFiles(): string[] {
    const paths: string[] = []

    if (isScalar(this.cmd)) {
      const value = this.cmd.value as string
      const matches = value.matchAll(/[\d/A-Za-z]+\.[A-Za-z]+/g)
      for (const match of matches) {
        paths.push(match[0])
      }
    }
    return paths
  }

  toJSON(): JsonValue {
    return this.cmd.toJSON()
  }
}

export class Stage implements IDvcYamlStage {
  name: string
  cmd?: ICmd
  deps?: Set<string>
  params?: Set<string>

  constructor(private pairNode: Pair, public parentDvcYaml: IDvcYamlModel) {
    this.name = pairNode.key as string
    const value = pairNode.value

    isMap(value) && this.buildModel(value)
  }

  clone(): IDvcYamlStage {
    return new Stage(this.pairNode, this.parentDvcYaml)
  }

  buildModel(value: YAMLMap) {
    const cmdNode = value.getIn(['cmd'], true) as Scalar | YAMLSeq | undefined
    this.cmd = Cmd.create(cmdNode)

    const depsNode = value.getIn(['deps'], true) as YAMLSeq | undefined
    isSeq(depsNode) && this.buildDependencies(depsNode)
  }

  buildDependencies(depsNode: YAMLSeq) {
    this.deps = new Set<string>()
    for (const item of depsNode.items) {
      if (isScalar(item)) {
        this.deps.add(item.value as string)
      }
    }
  }

  toJSON(): JsonValue {
    let json: Record<string, JsonValue> = {}
    const nodeValue = this.pairNode.value

    if (isNode(nodeValue)) {
      json = {
        ...nodeValue.toJSON()
      }
    }

    if (this.cmd) {
      json = {
        ...json,
        cmd: this.cmd.toJSON()
      }
    }

    if (this.deps) {
      json.deps = [...this.deps]
    }

    return json
  }

  addDependencies(items: string[]): void {
    const current = this.deps || new Set<string>()

    this.deps = new Set<string>([...current, ...items])
  }

  addParams(items: string[]): void {
    const current = this.params || new Set<string>()

    this.params = new Set<string>([...current, ...items])
  }

  dependsOnAll(): boolean {
    return true
  }

  contains(offset: number): boolean {
    const valueNode = this.pairNode.value

    return !!(
      isNode(valueNode) &&
      valueNode.range &&
      inRange(offset, valueNode.range[0], valueNode.range[2])
    )
  }
}

export class DvcYaml implements IDvcYamlModel {
  private stages: IDvcYamlStage[] = []

  constructor(private document: IDvcTextDocument) {
    const yamlDoc = this.document.getYamlDocument()
    this.setStages(yamlDoc.get('stages', true))
  }

  clone(): IDvcYamlModel {
    return new DvcYaml(this.document)
  }

  setStages(node: unknown) {
    if (isMap(node)) {
      for (const pair of node.items) {
        this.stages.push(new Stage(pair, this))
      }
    }
  }

  getStageAt(position: Position): IDvcYamlStage | undefined {
    const offset = this.document.offsetAt(position)
    return this.stages.find(stage => stage.contains(offset))
  }

  toString(): string {
    const stages: JsonValue = {}

    for (const stage of this.stages) {
      stages[stage.name] = stage.toJSON()
    }
    const model = {
      stages
    }

    return new Document(model).toString()
  }
}

export type JsonValue = string | { [key: string]: JsonValue } | JsonValue[]
