import { basename, extname } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { scm, SourceControl, SourceControlResourceGroup, Uri } from 'vscode'

export type SourceControlManagementState = Record<Status, Set<string>>

export interface SourceControlManagementModel {
  getState: () => SourceControlManagementState
}

enum Status {
  ADDED = 'added',
  DELETED = 'deleted',
  GIT_MODIFIED = 'gitModified',
  MODIFIED = 'modified',
  NOT_IN_CACHE = 'notInCache',
  RENAMED = 'renamed',
  UNTRACKED = 'untracked'
}

const gitCommitReady = [Status.ADDED, Status.GIT_MODIFIED, Status.RENAMED]

type ResourceState = { resourceUri: Uri; contextValue: Status; dvcRoot: string }

export class SourceControlManagement {
  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string

  private changedResourceGroup: SourceControlResourceGroup
  private gitCommitReadyResourceGroup: SourceControlResourceGroup
  private notInCacheResourceGroup: SourceControlResourceGroup

  constructor(dvcRoot: string, state: SourceControlManagementState) {
    this.dvcRoot = dvcRoot

    const scmView = this.dispose.track(
      scm.createSourceControl('dvc', 'DVC', Uri.file(dvcRoot))
    )

    scmView.inputBox.visible = false

    this.changedResourceGroup = this.createResourceGroup(
      dvcRoot,
      scmView,
      'changes',
      'Changes'
    )

    this.gitCommitReadyResourceGroup = this.createResourceGroup(
      dvcRoot,
      scmView,
      'gitCommitReady',
      'Ready For Git Commit'
    )

    this.notInCacheResourceGroup = this.createResourceGroup(
      dvcRoot,
      scmView,
      'notInCache',
      'Not In Cache'
    )

    this.setState(state)
  }

  public setState(state: SourceControlManagementState) {
    this.changedResourceGroup.resourceStates = this.collectResourceStates(
      state,
      Object.values(Status).filter(
        status => ![...gitCommitReady, Status.NOT_IN_CACHE].includes(status)
      )
    )

    this.gitCommitReadyResourceGroup.resourceStates =
      this.collectResourceStates(state, gitCommitReady)

    this.notInCacheResourceGroup.resourceStates = this.collectResourceStates(
      state,
      [Status.NOT_IN_CACHE]
    )
  }

  public getState() {
    return {
      changes: this.changedResourceGroup.resourceStates,
      gitCommitReady: this.gitCommitReadyResourceGroup.resourceStates,
      notInCache: this.notInCacheResourceGroup.resourceStates
    }
  }

  private createResourceGroup(
    dvcRoot: string,
    scmView: SourceControl,
    id: string,
    title: string
  ) {
    const resourceGroup = this.dispose.track(
      scmView.createResourceGroup(id, title)
    )

    resourceGroup.hideWhenEmpty = true

    Object.assign(resourceGroup, { rootUri: Uri.file(dvcRoot) })
    return resourceGroup
  }

  private collectResourceStates(
    state: SourceControlManagementState,
    validStatuses: Status[]
  ) {
    const acc: ResourceState[] = []
    Object.entries(state).forEach(entry => {
      const [status, resources] = entry as [Status, Set<string>]
      if (validStatuses.includes(status)) {
        acc.push(...this.getResourceStates(status, resources))
      }
    })
    return acc
  }

  private getResourceStates(
    contextValue: Status,
    paths: Set<string>
  ): ResourceState[] {
    return [...paths]
      .filter(
        path => extname(path) !== '.dvc' && basename(path) !== '.gitignore'
      )
      .map(path => {
        return {
          contextValue,
          dvcRoot: this.dvcRoot,
          resourceUri: Uri.file(path)
        }
      })
  }
}
