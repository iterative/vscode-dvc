import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy } from 'sinon'
import { Disposable } from '../../../../extension'
import { Config } from '../../../../config'
import { DvcViewer } from '../../../../cli/dvc/viewer'
import { dvcDemoPath } from '../../../util'
import { ViewableCliProcess } from '../../../../cli/viewable'

suite('DVC Viewer Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('DvcViewer', () => {
    it('should only be able to run a command once', async () => {
      const mockConfig = {
        getCliPath: () => 'sleep',
        getPythonBinPath: () => undefined
      } as Config
      const dvcViewer = disposable.track(new DvcViewer(mockConfig))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getProcess = (dvcViewer: any, id: string): ViewableCliProcess =>
        dvcViewer.processes[id]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createProcessSpy = spy(dvcViewer as any, 'createProcess')

      await dvcViewer.run('command', dvcDemoPath, '10000')

      expect(createProcessSpy).to.be.called
      const viewableProcess = getProcess(
        dvcViewer,
        [dvcDemoPath, '10000'].join(':')
      )
      const showProcessSpy = spy(viewableProcess, 'show')

      createProcessSpy.resetHistory()

      await dvcViewer.run('command', dvcDemoPath, '10000')

      expect(createProcessSpy).not.to.be.called
      expect(showProcessSpy).to.be.calledOnce
    })
  })
})
