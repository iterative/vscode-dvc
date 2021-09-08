import { EventEmitter } from 'vscode'
import { MementoPrefixes, ParamsAndMetricsModel, Status } from './model'
import { joinParamOrMetricPath } from './paths'
import { buildMockMemento } from '../../test/util'

jest.mock('vscode', () => ({
  EventEmitter: function (this: EventEmitter<void>) {
    this.fire = () => {}
  }
}))

describe('ParamsAndMetricsModel', () => {
  describe('persistence', () => {
    const paramsDotYamlPath = joinParamOrMetricPath('params', 'params.yaml')
    const testParamPath = joinParamOrMetricPath(paramsDotYamlPath, 'testparam')
    const exampleDvcRoot = 'test'
    const exampleData = {
      workspace: {
        baseline: {
          data: {
            params: {
              'params.yaml': {
                data: {
                  testparam: true
                }
              }
            }
          }
        }
      }
    }
    it('Shows all items when given no persisted status', async () => {
      const model = new ParamsAndMetricsModel(
        exampleDvcRoot,
        buildMockMemento()
      )
      await model.transformAndSet(exampleData)
      expect(model.getSelected()).toEqual([
        {
          group: 'params',
          hasChildren: false,
          maxStringLength: 4,
          name: 'testparam',
          parentPath: paramsDotYamlPath,
          path: testParamPath,
          types: ['boolean']
        },
        {
          group: 'params',
          hasChildren: true,
          name: 'params.yaml',
          parentPath: 'params',
          path: paramsDotYamlPath
        }
      ])
    })

    it('Maintains deselection from persisted status', async () => {
      const model = new ParamsAndMetricsModel(
        exampleDvcRoot,
        buildMockMemento({
          [MementoPrefixes.status + exampleDvcRoot]: {
            [paramsDotYamlPath]: Status.indeterminate,
            [testParamPath]: Status.unselected
          }
        })
      )
      await model.transformAndSet(exampleData)
      expect(model.getSelected()).toEqual([
        {
          group: 'params',
          hasChildren: true,
          name: 'params.yaml',
          parentPath: 'params',
          path: paramsDotYamlPath
        }
      ])
    })
  })
})
