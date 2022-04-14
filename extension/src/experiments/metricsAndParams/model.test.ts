import { MetricsAndParamsModel } from './model'
import { appendMetricOrParamToPath, joinMetricOrParamPath } from './paths'
import { buildMockMemento } from '../../test/util'
import { Status } from '../../path/selection/model'
import { PersistenceKey } from '../../persistence/constants'
import { MetricOrParamType } from '../webview/contract'

describe('MetricsAndParamsModel', () => {
  const exampleDvcRoot = 'test'

  describe('persistence', () => {
    const paramsDotYamlPath = joinMetricOrParamPath(
      MetricOrParamType.PARAMS,
      'params.yaml'
    )
    const testParamPath = appendMetricOrParamToPath(
      paramsDotYamlPath,
      'testparam'
    )
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
      expect(model.getSelected()).toStrictEqual([
        {
          hasChildren: true,
          name: 'params.yaml',
          parentPath: MetricOrParamType.PARAMS,
          path: paramsDotYamlPath,
          type: MetricOrParamType.PARAMS
        },
        {
          hasChildren: false,
          maxStringLength: 4,
          name: 'testparam',
          parentPath: paramsDotYamlPath,
          path: testParamPath,
          pathArray: [MetricOrParamType.PARAMS, 'params.yaml', 'testparam'],
          type: MetricOrParamType.PARAMS,
          types: ['boolean']
        }
      ])
    })

    it('Maintains deselection from persisted status', async () => {
      const model = new MetricsAndParamsModel(
        exampleDvcRoot,
        buildMockMemento({
          [PersistenceKey.METRICS_AND_PARAMS_STATUS + exampleDvcRoot]: {
            [paramsDotYamlPath]: Status.INDETERMINATE,
            [testParamPath]: Status.UNSELECTED
          }
        })
      )
      await model.transformAndSet(exampleData)
      expect(model.getSelected()).toStrictEqual([
        {
          hasChildren: true,
          name: 'params.yaml',
          parentPath: MetricOrParamType.PARAMS,
          path: paramsDotYamlPath,
          type: MetricOrParamType.PARAMS
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
          [PersistenceKey.METRICS_AND_PARAMS_COLUMN_ORDER + exampleDvcRoot]:
            persistedState
        })
      )
      expect(model.getColumnOrder()).toStrictEqual(persistedState)
    })

    it('should re-order the columns if a new columnOrder is set', () => {
      const model = new MetricsAndParamsModel(
        exampleDvcRoot,
        buildMockMemento({
          [PersistenceKey.METRICS_AND_PARAMS_COLUMN_ORDER + exampleDvcRoot]: [
            { path: 'A', width: 0 },
            { path: 'B', width: 0 },
            { path: 'C', width: 0 }
          ]
        })
      )
      const newState = ['C', 'B', 'A']
      model.setColumnOrder(newState)
      expect(model.getColumnOrder()).toStrictEqual(newState)
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
          [PersistenceKey.METRICS_AND_PARAMS_COLUMN_ORDER + exampleDvcRoot]:
            persistedState
        })
      )
      expect(model.getColumnOrder()).toStrictEqual(persistedState)
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
          [PersistenceKey.METRICS_AND_PARAMS_COLUMN_ORDER + exampleDvcRoot]:
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
