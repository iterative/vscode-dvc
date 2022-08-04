import { load } from 'js-yaml'
import { keys, toPath } from 'lodash'
import get from 'lodash.get'
import {
  DvcYAML,
  isStage,
  parseDvcYaml,
  Stage
} from '../fileSystem/dvcYaml/dvcYaml'
import { Any } from '../util/object'

export interface DvcYamlSupportFile {
  contents: string
  type: 'JSON' | 'YAML'
}

export interface DvcYamlSupportWorkspace {
  findFiles(relativePaths: string[]): Promise<DvcYamlSupportFile[] | undefined>
}

class SymbolFileChecker {
  private symbolFiles: string[] = ['params.yaml']

  public check(dvcYaml: DvcYAML) {
    this.checkStagesForFiles(dvcYaml)
    this.checkVarsForFiles(dvcYaml)

    return [...new Set(this.symbolFiles)]
  }

  public checkVarsForFiles(dvcYaml: DvcYAML) {
    const vars = dvcYaml.vars ?? []

    for (const dvcVar of vars) {
      if (typeof dvcVar === 'string') {
        this.checkStringForFiles(dvcVar)
      }
    }
  }

  public checkStagesForFiles(dvcYaml: DvcYAML) {
    const stages = dvcYaml.stages ?? {}

    for (const stage of Object.values(stages)) {
      isStage(stage) && this.checkMetricsForFiles(stage)
    }
  }

  public checkMetricsForFiles(stage: Stage) {
    for (const metric of stage.metrics ?? []) {
      this.checkStringForFiles(
        typeof metric === 'string' ? metric : keys(metric)[0]
      )
    }
  }

  public checkStringForFiles(str: string): void {
    if (str.includes('.yaml') || str.includes('.json')) {
      this.symbolFiles.push(str.split(':')[0])
    }
  }
}

export interface DvcYamlCompletionItem {
  label: string
  completion: string
}

export class DvcYamlSupport {
  private readonly workspace: DvcYamlSupportWorkspace
  private parsedFiles: Record<string, Any>[] = []
  private symbolFileChecker: SymbolFileChecker

  constructor(workspace: DvcYamlSupportWorkspace) {
    this.workspace = workspace
    this.symbolFileChecker = new SymbolFileChecker()
  }

  async init(dvcYaml: string): Promise<void> {
    if (this.parsedFiles.length > 0) {
      return
    }

    const files = await this.workspace.findFiles(
      this.symbolFileChecker.check(parseDvcYaml(dvcYaml))
    )

    this.parsedFiles =
      files?.map(({ type, contents }) => {
        switch (type) {
          case 'JSON':
            return JSON.parse(contents)
          case 'YAML':
            return load(contents)
        }
      }) ?? []
  }

  provideCompletions(currentLine: string): DvcYamlCompletionItem[] {
    const segmentOfInterest = currentLine.match(/[\w.]+$/)?.[0]

    return segmentOfInterest
      ? this.provideCompletionsForSymbols(segmentOfInterest)
      : []
  }

  private getTopLevelSymbols(fragment: string) {
    return this.parsedFiles
      .flatMap(dict => keys(dict))
      .filter(key => key.startsWith(fragment))
      .map(label => ({ completion: label, label }))
  }

  private getClosestCompletePaths(pathArray: string[]) {
    const tail = pathArray.pop() ?? ''
    const topPath = pathArray
    const topValues = this.parsedFiles.map(dict => get(dict, topPath))
    const topKeys = topValues
      .flatMap(value => keys(value))
      .filter(key => key.startsWith(tail))

    return topKeys.map(key => {
      return { completion: `${topPath.join('.')}.${key}`, label: key }
    })
  }

  private provideCompletionsForSymbols(cleanLine: string) {
    const pathArray = toPath(cleanLine)

    switch (pathArray.length) {
      case 0:
        return []
      case 1:
        return this.getTopLevelSymbols(pathArray[0])
      default:
        return this.getClosestCompletePaths(pathArray)
    }
  }
}
