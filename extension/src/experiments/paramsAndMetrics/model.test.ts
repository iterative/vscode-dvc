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
      const persistedState = [
        { path: 'A', width: 0 },
        { path: 'C', width: 0 },
        { path: 'B', width: 0 }
      ]
      const model = new ParamsAndMetricsModel(
        exampleDvcRoot,
        buildMockMemento({
          [MementoPrefixes.columnsOrder + exampleDvcRoot]: persistedState
        })
      )
      expect(model.getColumnsOrder()).toEqual(persistedState)
    })

    it('should re-order the columns if a new columnOrder is set', () => {
      const model = new ParamsAndMetricsModel(
        exampleDvcRoot,
        buildMockMemento({
          [MementoPrefixes.columnsOrder + exampleDvcRoot]: [
            { path: 'A', width: 0 },
            { path: 'B', width: 0 },
            { path: 'C', width: 0 }
          ]
        })
      )
      const newState = ['C', 'B', 'A']
      model.setColumnsOrder(newState)
      expect(model.getColumnsOrder().map(column => column.path)).toEqual(
        newState
      )
    })
  })

  describe('columns width', () => {
    it('should return the columns width from the persisted state', () => {
      const persistedState = [
        { path: 'A', width: 10 },
        { path: 'C', width: 42 },
        { path: 'B', width: 150 }
      ]
      const model = new ParamsAndMetricsModel(
        exampleDvcRoot,
        buildMockMemento({
          [MementoPrefixes.columnsOrder + exampleDvcRoot]: persistedState
        })
      )
      expect(model.getColumnsOrder()).toEqual(persistedState)
    })

    it('should set the width to a column when calling setColumnWidth', () => {
      const persistedState = [
        { path: 'A', width: 10 },
        { path: 'C', width: 42 },
        { path: 'B', width: 150 }
      ]
      const model = new ParamsAndMetricsModel(
        exampleDvcRoot,
        buildMockMemento({
          [MementoPrefixes.columnsOrder + exampleDvcRoot]: persistedState
        })
      )
      const expectedWidth = 77
      model.setColumnWidth('C', expectedWidth)

      expect(model.getColumnsOrder()[1].width).toBe(expectedWidth)
    })
  })
})
