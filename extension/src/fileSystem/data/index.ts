import { join } from 'path'
import { Event, EventEmitter } from 'vscode'
import { isSameOrChild, loadYaml, PartialDvcYaml } from '..'
import { findFiles } from '../workspace'
import { createFileSystemWatcher, getRelativePattern } from '../watcher'
import { DeferredDisposable } from '../../class/deferred'

export class FileSystemData extends DeferredDisposable {
  public readonly onDidUpdate: Event<{ path: string; yaml: PartialDvcYaml }>

  private readonly dvcRoot: string

  private readonly updated = this.dispose.track(
    new EventEmitter<{ path: string; yaml: PartialDvcYaml }>()
  )

  constructor(dvcRoot: string) {
    super()

    this.dvcRoot = dvcRoot
    this.onDidUpdate = this.updated.event

    this.watchDvcYaml()
    this.initialize()
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
    return createFileSystemWatcher(
      disposable => this.dispose.track(disposable),
      getRelativePattern(this.dvcRoot, join('**', 'dvc.yaml')),
      path => {
        if (!path) {
          return
        }
        const yaml = loadYaml<PartialDvcYaml>(path)
        if (yaml) {
          this.updated.fire({ path, yaml })
        }
      }
    )
  }
}
