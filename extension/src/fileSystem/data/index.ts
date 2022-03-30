import { join } from 'path'
import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { isSameOrChild, loadYaml, PartialDvcYaml } from '..'
import { findFiles } from '../workspace'
import { createFileSystemWatcher } from '../watcher'

export class FileSystemData {
  public readonly dispose = Disposable.fn()

  public readonly onDidUpdate: Event<{ path: string; yaml: PartialDvcYaml }>

  private readonly dvcRoot: string

  private readonly updated = this.dispose.track(
    new EventEmitter<{ path: string; yaml: PartialDvcYaml }>()
  )

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  constructor(dvcRoot: string) {
    this.dvcRoot = dvcRoot
    this.onDidUpdate = this.updated.event

    this.watchDvcYaml()
    this.initialize()
  }

  public isReady() {
    return this.initialized
  }

  private async initialize() {
    const files = await findFiles(join('**', 'dvc.yaml'))
    const filesInRepo = files.filter(file => isSameOrChild(this.dvcRoot, file))

    filesInRepo.map(path => {
      const yaml = loadYaml<PartialDvcYaml>(path)
      if (yaml) {
        this.updated.fire({ path, yaml })
      }
    })

    this.deferred.resolve()
  }

  private watchDvcYaml() {
    this.dispose.track(
      createFileSystemWatcher(join(this.dvcRoot, '**', 'dvc.yaml'), path => {
        if (!path) {
          return
        }
        const yaml = loadYaml<PartialDvcYaml>(path)
        if (yaml) {
          this.updated.fire({ path, yaml })
        }
      })
    )
  }
}
