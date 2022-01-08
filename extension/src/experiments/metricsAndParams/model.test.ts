import { MetricsAndParamsModel, Status } from './model'
import { joinMetricOrParamPath } from './paths'
import { buildMockMemento } from '../../test/util'
import { MementoPrefix } from '../../vscode/memento'

describe('MetricsAndParamsModel', () => {
  const exampleDvcRoot = 'test'

  describe('persistence', () => {
    const paramsDotYamlPath = joinMetricOrParamPath('params', 'params.yaml')
    const testParamPath = joinMetricOrParamPath(paramsDotYamlPath, 'testparam')
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
      const model = new MetricsAndParamsModel(
        exampleDvcRoot,
        buildMockMemento()
      )
      await model.transformAndSet(exampleData)
      expect(model.getSelected()).toEqual([
        {
          group: 'params',
          hasChildren: true,
          name: 'params.yaml',
          parentPath: 'params',
          path: paramsDotYamlPath
        },
        {
          group: 'params',
          hasChildren: false,
          maxStringLength: 4,
          name: 'testparam',
          parentPath: paramsDotYamlPath,
          path: testParamPath,
          types: ['boolean']
        }
      ])
    })

    it('Maintains deselection from persisted status', async () => {
      const model = new MetricsAndParamsModel(
        exampleDvcRoot,
        buildMockMemento({
          [MementoPrefix.METRICS_AND_PARAMS_STATUS + exampleDvcRoot]: {
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
      const model = new MetricsAndParamsModel(
        exampleDvcRoot,
        buildMockMemento({
          [MementoPrefix.METRICS_AND_PARAMS_COLUMN_ORDER + exampleDvcRoot]:
            persistedState
        })
      )
      expect(model.getColumnOrder()).toEqual(persistedState)
    })

    it('should re-order the columns if a new columnOrder is set', () => {
      const model = new MetricsAndParamsModel(
        exampleDvcRoot,
        buildMockMemento({
          [MementoPrefix.METRICS_AND_PARAMS_COLUMN_ORDER + exampleDvcRoot]: [
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
      const model = new MetricsAndParamsModel(
        exampleDvcRoot,
        buildMockMemento({
          [MementoPrefix.METRICS_AND_PARAMS_COLUMN_ORDER + exampleDvcRoot]:
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
      const model = new MetricsAndParamsModel(
        exampleDvcRoot,
        buildMockMemento({
          [MementoPrefix.METRICS_AND_PARAMS_COLUMN_ORDER + exampleDvcRoot]:
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
