import { join } from 'path'
import { Event, EventEmitter } from 'vscode'
import { appendFileSync, writeFileSync } from 'fs-extra'
import { setContextForEditorTitleIcons } from './context'
import { PipelineData } from './data'
import { PipelineModel } from './model'
import {
  addNewPlotToDvcYaml,
  getFieldOptions,
  parseDataFile,
  pickDataFile,
  pickTemplateAndFields
} from './util'
import { DeferredDisposable } from '../class/deferred'
import { InternalCommands } from '../commands/internal'
import { TEMP_DAG_FILE } from '../cli/dvc/constants'
import { findOrCreateDvcYamlFile, getFileExtension } from '../fileSystem'
import { getInput, getValidInput } from '../vscode/inputBox'
import { Title } from '../vscode/title'
import { quickPickOne, quickPickOneOrInput } from '../vscode/quickPick'
import { pickFile } from '../vscode/resourcePicker'
import { Toast } from '../vscode/toast'

export enum ScriptCommand {
  JUPYTER = 'jupyter nbconvert --to notebook --inplace --execute',
  PYTHON = 'python'
}

const getScriptCommand = (script: string) => {
  switch (getFileExtension(script)) {
    case '.py':
      return ScriptCommand.PYTHON
    case '.ipynb':
      return ScriptCommand.JUPYTER
    default:
      return ''
  }
}

export class Pipeline extends DeferredDisposable {
  public onDidUpdate: Event<void>
  public readonly onDidFocusProject: Event<string | undefined>

  private updated: EventEmitter<void>

  private focusedPipeline: string | undefined
  private readonly pipelineFileFocused: EventEmitter<string | undefined> =
    this.dispose.track(new EventEmitter())

  private readonly onDidFocusPipelineFile: Event<string | undefined> =
    this.pipelineFileFocused.event

  private projectFocused: EventEmitter<string | undefined> = this.dispose.track(
    new EventEmitter()
  )

  private readonly dvcRoot: string
  private readonly data: PipelineData
  private readonly model: PipelineModel

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    subProjects: string[],
    data?: PipelineData
  ) {
    super()
    this.dvcRoot = dvcRoot
    this.data = this.dispose.track(
      data || new PipelineData(dvcRoot, internalCommands, subProjects)
    )
    this.model = this.dispose.track(new PipelineModel())
    this.updated = this.dispose.track(new EventEmitter<void>())
    this.onDidUpdate = this.updated.event

    this.onDidFocusProject = this.projectFocused.event

    void this.initialize()
    this.watchActiveEditor(subProjects)
  }

  public hasPipeline() {
    return this.model.hasPipeline()
  }

  public async getCwd() {
    const focusedPipeline = this.getFocusedPipeline()
    if (focusedPipeline) {
      return focusedPipeline
    }

    await this.checkOrAddPipeline()

    const pipelines = this.model.getPipelines()
    if (!pipelines?.size) {
      return
    }
    if (pipelines.has(this.dvcRoot)) {
      return this.dvcRoot
    }
    if (pipelines.size === 1) {
      return [...pipelines][0]
    }

    return quickPickOne(
      [...pipelines],
      'Select a Pipeline to Run Command Against'
    )
  }

  public checkOrAddPipeline() {
    if (this.model.hasPipeline()) {
      return
    }
    return this.addPipeline()
  }

  // TBD we're going to want to move more of this code into utils
  // for easier testing
  public async addTopLevelPlot() {
    const cwd = await this.getCwd()

    if (!cwd) {
      return
    }

    const file = await pickDataFile()

    if (!file) {
      return
    }

    const data = parseDataFile(file)

    if (!data) {
      // TBD maybe we could add an action to toasts that lets you try again?
      return Toast.showError('Failed to parse data from file.')
    }

    const keys = getFieldOptions(data)

    if (keys.length === 0) {
      return Toast.showError(
        'Failed to find field options for plot data. Is your file following DVC plot guidelines for [JSON/YAML](https://dvc.org/doc/command-reference/plots/show#example-hierarchical-data) or [CSV/TSV](https://dvc.org/doc/command-reference/plots/show#example-tabular-data) files?'
      )
    }

    const templateAndFields = await pickTemplateAndFields(keys)

    if (!templateAndFields) {
      return
    }

    addNewPlotToDvcYaml(cwd, file, templateAndFields)
  }

  public forceRerender() {
    return appendFileSync(join(this.dvcRoot, TEMP_DAG_FILE), '\n')
  }

  private async initialize() {
    this.dispose.track(
      this.data.onDidUpdate(({ dag, stages }) => {
        this.writeDag(dag)
        const hasPipeline = this.model.hasPipeline()
        this.model.transformAndSet(stages)
        if (hasPipeline !== this.model.hasPipeline()) {
          this.updated.fire()
        }
      })
    )
    void this.data.managedUpdate()

    await this.data.isReady()
    return this.deferred.resolve()
  }

  private async addPipeline() {
    const stageName = await this.askForStageName()
    if (!stageName) {
      return
    }

    const { trainingScript, command, enteredManually } =
      await this.askForTrainingScript()
    if (!trainingScript) {
      return
    }

    const dataUpdated = new Promise(resolve => {
      const listener = this.dispose.track(
        this.data.onDidUpdate(() => {
          resolve(undefined)
          this.dispose.untrack(listener)
          listener.dispose()
        })
      )
    })

    void findOrCreateDvcYamlFile(
      this.dvcRoot,
      trainingScript,
      stageName,
      command,
      !enteredManually
    )
    void this.data.managedUpdate()
    return dataUpdated
  }

  private async askForStageName() {
    return await getValidInput(
      Title.ENTER_STAGE_NAME,
      (stageName?: string) => {
        if (!stageName) {
          return 'Stage name must not be empty'
        }
        if (!/^[a-z]/i.test(stageName)) {
          return 'Stage name should start with a letter'
        }
        return /^\w+$/.test(stageName)
          ? null
          : 'Stage name should only include letters and numbers'
      },
      { value: 'train' }
    )
  }

  private async askForTrainingScript() {
    const selectValue = 'select'
    const pathOrSelect = await quickPickOneOrInput(
      [{ label: 'Select from file explorer', value: selectValue }],
      {
        defaultValue: '',
        placeholder: 'Path to script',
        title: Title.ENTER_PATH_OR_CHOOSE_FILE
      }
    )

    const trainingScript =
      pathOrSelect === selectValue
        ? await pickFile(Title.SELECT_TRAINING_SCRIPT)
        : pathOrSelect

    if (!trainingScript) {
      return {
        command: undefined,
        enteredManually: false,
        trainingScript: undefined
      }
    }

    const command =
      getScriptCommand(trainingScript) ||
      (await getInput(Title.ENTER_COMMAND_TO_RUN)) ||
      ''
    const enteredManually = pathOrSelect !== selectValue
    return { command, enteredManually, trainingScript }
  }

  private writeDag(dag: string) {
    writeFileSync(join(this.dvcRoot, TEMP_DAG_FILE), dag)
  }

  private getFocusedPipeline() {
    return this.focusedPipeline
  }

  private watchActiveEditor(subProjects: string[]) {
    setContextForEditorTitleIcons(
      this.dvcRoot,
      this.dispose,
      this.pipelineFileFocused,
      subProjects
    )

    this.dispose.track(
      this.onDidFocusPipelineFile(cwd => {
        this.focusedPipeline = cwd
        this.projectFocused.fire(cwd && this.dvcRoot)
      })
    )
  }
}
