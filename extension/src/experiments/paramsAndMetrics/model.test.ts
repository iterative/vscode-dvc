import { ParamsAndMetricsModel, Status } from './model'
import { joinParamOrMetricPath } from './paths'
import { buildMockMemento } from '../../test/util'
import { MementoPrefix } from '../../vscode/memento'

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
          [MementoPrefix.PARAMS_AND_METRICS_STATUS + exampleDvcRoot]: {
            [paramsDotYamlPath]: Status.INDETERMINATE,
            [testParamPath]: Status.UNSELECTED
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
          [MementoPrefix.PARAMS_AND_METRICS_COLUMN_ORDER + exampleDvcRoot]:
            persistedState
        })
      )
      expect(model.getColumnOrder()).toEqual(persistedState)
    })

    it('should re-order the columns if a new columnOrder is set', () => {
      const model = new ParamsAndMetricsModel(
        exampleDvcRoot,
        buildMockMemento({
          [MementoPrefix.PARAMS_AND_METRICS_COLUMN_ORDER + exampleDvcRoot]: [
            { path: 'A', width: 0 },
            { path: 'B', width: 0 },
            { path: 'C', width: 0 }
          ]
        })
      )
      const newState = ['C', 'B', 'A']
      model.setColumnOrder(newState)
      expect(model.getColumnOrder()).toEqual(newState)
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
          [MementoPrefix.PARAMS_AND_METRICS_COLUMN_ORDER + exampleDvcRoot]:
            persistedState
        })
      )
      expect(model.getColumnOrder()).toEqual(persistedState)
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
          [MementoPrefix.PARAMS_AND_METRICS_COLUMN_ORDER + exampleDvcRoot]:
            persistedState
        })
      )
      const changedColumnId = 'C'
      const expectedWidth = 77

      model.setColumnWidth(changedColumnId, expectedWidth)

      expect(model.getColumnWidths()[changedColumnId]).toBe(expectedWidth)
    })
  })
})
