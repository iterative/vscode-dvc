import { join } from 'path'
import { Event, EventEmitter } from 'vscode'
import { DvcYAML } from './dvcYaml'
import { isSameOrChild, loadYaml } from '..'
import { findFiles } from '../workspace'
import { createFileSystemWatcher } from '../watcher'
import { DeferredDisposable } from '../../class/deferred'

export class FileSystemDvcYamlData extends DeferredDisposable {
  public readonly onDidUpdate: Event<{ path: string; yaml: DvcYAML }>

  private readonly dvcRoot: string

  private readonly updated = this.dispose.track(
    new EventEmitter<{ path: string; yaml: DvcYAML }>()
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
      const yaml = loadYaml<DvcYAML>(path)
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
        const yaml = loadYaml<DvcYAML>(path)
        if (yaml) {
          this.updated.fire({ path, yaml })
        }
      })
    )
  }
}
