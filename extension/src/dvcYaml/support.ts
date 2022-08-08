import { load } from 'js-yaml'
import { keys, toPath } from 'lodash'
import get from 'lodash.get'
import {
  DvcYAML,
  isStage,
  parseDvcYaml,
  Stage,
  Var
} from '../fileSystem/dvcYaml/dvcYaml'
import { Any } from '../util/object'

export interface DvcYamlSupportFile {
  path: string
  contents: string
}

export interface DvcYamlSupportWorkspace {
  findFiles(relativePaths: string[]): Promise<DvcYamlSupportFile[] | undefined>
}

class StringFileChecker {
  protected symbolFiles: string[] = ['params.yaml']

  protected checkStringForFiles(str: string): void {
    if (str.includes('.yaml') || str.includes('.json')) {
      this.symbolFiles.push(str.split(':')[0])
    }
  }
}

class StagesFileChecker extends StringFileChecker {
  protected checkStagesForFiles(dvcYaml: DvcYAML) {
    const stages = dvcYaml.stages ?? {}

    for (const stage of Object.values(stages)) {
      isStage(stage) && this.checkMetricsForFiles(stage)
    }
  }

  private checkMetricsForFiles(stage: Stage) {
    for (const metric of stage.metrics ?? []) {
      this.checkStringForFiles(
        typeof metric === 'string' ? metric : keys(metric)[0]
      )
    }
  }
}

class SymbolFileChecker extends StagesFileChecker {
  public check(dvcYaml: DvcYAML) {
    this.checkStagesForFiles(dvcYaml)
    this.checkVarsForFiles(dvcYaml)

    return [...new Set(this.symbolFiles)]
  }

  private checkVarsForFiles(dvcYaml: DvcYAML) {
    const vars = dvcYaml.vars ?? []

    for (const dvcVar of vars) {
      if (typeof dvcVar === 'string') {
        this.checkStringForFiles(dvcVar)
      }
    }
  }
}

export interface DvcYamlCompletionItem {
  label: string
  completion: string
}

abstract class SymbolsCompletionProvider {
  public provideCompletions(cleanLine: string) {
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

  protected abstract getTopLevelSymbols(
    symbolPrefix: string
  ): DvcYamlCompletionItem[]

  protected abstract getClosestCompletePaths(
    incompletePath: string[]
  ): DvcYamlCompletionItem[]
}

class InternalSymbolsCompletionsProvider extends SymbolsCompletionProvider {
  private dvcYaml: DvcYAML
  private internalVars: Var[]

  constructor(dvcYaml: DvcYAML) {
    super()
    this.dvcYaml = dvcYaml
    this.internalVars = [...(dvcYaml.vars ?? [])]
    const stages = dvcYaml.stages ?? {}

    for (const item of Object.values(stages)) {
      isStage(item) && item.vars && this.internalVars.push(...item.vars)
    }
  }

  protected getTopLevelSymbols(fragment: string) {
    return this.internalVars
      .flatMap(entry => (typeof entry === 'string' ? entry : keys(entry)))
      .filter(key => key.startsWith(fragment))
      .map(label => ({ completion: label, label }))
  }

  protected getClosestCompletePaths(pathArray: string[]) {
    const tail = pathArray.pop() ?? ''
    const topPath = pathArray
    const topValues = this.internalVars
      .filter(entry => typeof entry !== 'string')
      .map(dict => get(dict, topPath))
    const topKeys = topValues
      .flatMap(value => keys(value))
      .filter(key => key.startsWith(tail))

    return topKeys.map(key => {
      return { completion: `${topPath.join('.')}.${key}`, label: key }
    })
  }
}

class ExternalSymbolsCompletionsProvider extends SymbolsCompletionProvider {
  private parsedFiles: Record<string, Any>[] = []

  constructor(parsedFiles: Record<string, Any>[]) {
    super()
    this.parsedFiles = parsedFiles
  }

  protected getTopLevelSymbols(fragment: string) {
    return this.parsedFiles
      .flatMap(dict => keys(dict))
      .filter(key => key.startsWith(fragment))
      .map(label => ({ completion: label, label }))
  }

  protected getClosestCompletePaths(pathArray: string[]) {
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
}

export class DvcYamlSupport {
  private readonly workspace: DvcYamlSupportWorkspace
  private parsedFiles: Record<string, Any>[] = []
  private symbolFileChecker: SymbolFileChecker
  private dvcYaml: DvcYAML

  constructor(workspace: DvcYamlSupportWorkspace, dvcYaml: string) {
    this.workspace = workspace
    this.symbolFileChecker = new SymbolFileChecker()

    this.dvcYaml = parseDvcYaml(dvcYaml)
  }

  async init() {
    if (this.parsedFiles.length > 0) {
      return
    }

    const files = await this.workspace.findFiles(
      this.symbolFileChecker.check(this.dvcYaml)
    )

    this.parsedFiles =
      files?.map(({ path, contents }) => {
        return path.endsWith('.json') ? JSON.parse(contents) : load(contents)
      }) ?? []
  }

  provideCompletions(currentLine: string): DvcYamlCompletionItem[] {
    const segmentOfInterest = currentLine.match(/[\w.]+$/)?.[0]

    return segmentOfInterest ? this.gatherCompletions(segmentOfInterest) : []
  }

  private gatherCompletions(line: string) {
    const external = new ExternalSymbolsCompletionsProvider(
      this.parsedFiles
    ).provideCompletions(line)

    const internal = new InternalSymbolsCompletionsProvider(
      this.dvcYaml
    ).provideCompletions(line)

    return [...external, ...internal]
  }
}
