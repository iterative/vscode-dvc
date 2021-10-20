import { join, resolve } from 'path'
import { EventEmitter, Event } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { collectFiles } from './collect'
import {
  createFileSystemWatcher,
  createNecessaryFileSystemWatcher
} from '../fileSystem/watcher'
import { getGitRepositoryRoot } from '../git'
import { ProcessManager } from '../processManager'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { ExperimentsRepoJSONOutput } from '../cli/reader'
import { sameContents, uniqueValues } from '../util/array'

const DOT_GIT = '.git'
const GIT_REFS = join(DOT_GIT, 'refs')
export const EXPERIMENTS_GIT_REFS = join(GIT_REFS, 'exps')

export class Data {
  public readonly dispose = Disposable.fn()
  public readonly onDidChangeExperimentsData: Event<ExperimentsRepoJSONOutput>

  public onDidChangeParamsAndMetricsFiles: Event<void>

  private readonly dvcRoot: string
  private files: string[] = []

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private readonly processManager: ProcessManager
  private readonly internalCommands: InternalCommands
  private readonly experimentsDataChanged: EventEmitter<ExperimentsRepoJSONOutput> =
    this.dispose.track(new EventEmitter())

  private fileSystemWatcher?: Disposable
  private paramsAndMetricsFilesChanged = new EventEmitter<void>()

  constructor(dvcRoot: string, internalCommands: InternalCommands) {
    this.dvcRoot = dvcRoot
    this.processManager = new ProcessManager({
      name: 'refresh',
      process: () => this.updateData()
    })

    this.internalCommands = internalCommands
    this.onDidChangeExperimentsData = this.experimentsDataChanged.event
    this.onDidChangeParamsAndMetricsFiles =
      this.paramsAndMetricsFilesChanged.event

    const initialDataUpdate = this.dispose.track(
      this.onDidChangeExperimentsData(() => {
        this.fileSystemWatcher = this.watchParamsAndMetricsFiles()

        this.dispose.track(
          this.onDidChangeParamsAndMetricsFiles(() => {
            const watcher = this.watchParamsAndMetricsFiles()
            this.dispose.untrack(this.fileSystemWatcher)
            this.fileSystemWatcher?.dispose()
            this.fileSystemWatcher = watcher
          })
        )
        this.dispose.untrack(initialDataUpdate)
        initialDataUpdate.dispose()
        this.deferred.resolve()
      })
    )
    this.refresh()
  }

  public isReady() {
    return this.initialized
  }

  public refresh() {
    return this.processManager.run('refresh')
  }

  public async onDidChangeData(): Promise<void> {
    const gitRoot = await getGitRepositoryRoot(this.dvcRoot)
    const dotGitGlob = resolve(gitRoot, DOT_GIT, '**')
    this.dispose.track(
      createNecessaryFileSystemWatcher(dotGitGlob, (path: string) => {
        if (
          path.includes('HEAD') ||
          path.includes(EXPERIMENTS_GIT_REFS) ||
          path.includes(join(GIT_REFS, 'heads'))
        ) {
          return this.refresh()
        }
      })
    )
  }

  private async updateData(): Promise<void> {
    const data =
      await this.internalCommands.executeCommand<ExperimentsRepoJSONOutput>(
        AvailableCommands.EXPERIMENT_SHOW,
        this.dvcRoot
      )

    this.transformAndSetFiles(data)

    return this.notifyChanged(data)
  }

  private transformAndSetFiles(data: ExperimentsRepoJSONOutput) {
    const files = collectFiles(data)

    if (sameContents(this.files, files)) {
      return
    }

    this.files = files
    this.paramsAndMetricsFilesChanged.fire()
  }

  private notifyChanged(data: ExperimentsRepoJSONOutput) {
    this.experimentsDataChanged.fire(data)
  }

  private watchParamsAndMetricsFiles() {
    return this.dispose.track(
      createFileSystemWatcher(
        join(
          this.dvcRoot,
          '**',
          `{${uniqueValues([
            'dvc.lock',
            'dvc.yaml',
            'params.yaml',
            ...this.files
          ]).join(',')}}`
        ),
        () => this.refresh()
      )
    )
  }
}
