import { EventEmitter } from 'vscode'
import { MementoPrefixes, ParamsAndMetricsModel, Status } from './model'
import { joinParamOrMetricPath } from './paths'
import { buildMockMemento } from '../../test/util'
import { messenger, MessengerEvents } from '../../util/messaging'

jest.mock('vscode', () => ({
  EventEmitter: function (this: EventEmitter<void>) {
    this.fire = () => {}
  }
}))

describe('ParamsAndMetricsModel', () => {
  const exampleDvcRoot = 'test'

  describe('persistence', () => {
    const paramsDotYamlPath = joinParamOrMetricPath('params', 'params.yaml')
    const testParamPath = joinParamOrMetricPath(paramsDotYamlPath, 'testparam')
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

  describe('columns order', () => {
    it('should return the columns order from the persisted state', () => {
      const persistedState = ['A', 'C', 'B']
      const model = new ParamsAndMetricsModel(
        exampleDvcRoot,
        buildMockMemento({
          [MementoPrefixes.columnsOrder + exampleDvcRoot]: persistedState
        })
      )
      expect(model.getColumnsOrder()).toEqual(persistedState)
    })

    it('should re-order the columns after a columnReordered message is sent', () => {
      const model = new ParamsAndMetricsModel(
        exampleDvcRoot,
        buildMockMemento({
          [MementoPrefixes.columnsOrder + exampleDvcRoot]: ['A', 'B', 'C']
        })
      )
      const newState = ['C', 'B', 'A']
      messenger.emit(MessengerEvents.columnReordered, newState)
      expect(model.getColumnsOrder()).toEqual(newState)
    })
  })
})
