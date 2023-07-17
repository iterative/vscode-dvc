import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { restore, stub } from 'sinon'
import { expect } from 'chai'
import { Disposable } from '../../../extension'
import { PipelineData } from '../../../pipeline/data'
import { buildDependencies } from '../util'
import { dvcDemoPath } from '../../util'

suite('Pipeline Data Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(function () {
    this.timeout(6000)
    return disposable.dispose()
  })

  const buildPipelineData = async (
    dvcYamls: string[],
    subProjects: string[] = []
  ) => {
    const { internalCommands } = buildDependencies({
      disposer: disposable
    })

    const data = disposable.track(
      new PipelineData(dvcDemoPath, internalCommands, subProjects)
    )

    const mockMangedUpdate = stub(data, 'managedUpdate').resolves(undefined)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stub(data as any, 'findDvcYamls').resolves(dvcYamls)

    await data.update()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener = (path: string) => (data as any).listener(path)

    return {
      data,
      listener,
      mockMangedUpdate
    }
  }

  describe('PipelineData', () => {
    it('should call managedUpdate for the found dvc.yaml files', async () => {
      const dvcYaml = join(dvcDemoPath, 'dvc.yaml')
      const nestedDvcYaml = join(dvcDemoPath, 'data', 'dvc.yaml')

      const { listener, mockMangedUpdate } = await buildPipelineData([
        dvcYaml,
        nestedDvcYaml
      ])

      listener(dvcYaml)
      expect(mockMangedUpdate).to.be.calledOnce
      mockMangedUpdate.resetHistory()

      listener(nestedDvcYaml)
      expect(mockMangedUpdate).to.be.calledOnce
    })
  })

  it('should not call managedUpdate for a dvc.yaml in a sub-project', async () => {
    const dvcYaml = join(dvcDemoPath, 'dvc.yaml')
    const subProject = join(dvcDemoPath, 'data')
    const nestedDvcYaml = join(subProject, 'dvc.yaml')

    const { listener, mockMangedUpdate } = await buildPipelineData(
      [dvcYaml, nestedDvcYaml],
      [subProject]
    )

    listener(dvcYaml)
    expect(mockMangedUpdate).to.be.calledOnce
    mockMangedUpdate.resetHistory()

    listener(nestedDvcYaml)
    expect(mockMangedUpdate).not.to.be.calledOnce
  })
})
