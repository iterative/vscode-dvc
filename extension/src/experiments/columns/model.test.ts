import { ColumnsModel } from './model'
import { appendColumnToPath, buildMetricOrParamPath } from './paths'
import { buildMockMemento } from '../../test/util'
import { Status } from '../../path/selection/model'
import { PersistenceKey } from '../../persistence/constants'
import { ColumnType } from '../webview/contract'
import outputFixture from '../../test/fixtures/expShow/output'
import columnsFixture from '../../test/fixtures/expShow/columns'
import {
  deeplyNestedOutput,
  columns as deeplyNestedColumns
} from '../../test/fixtures/expShow/deeplyNested'

describe('ColumnsModel', () => {
  const exampleDvcRoot = 'test'

  it('should return columns that equal the columns fixture when given the output fixture', async () => {
    const model = new ColumnsModel('', buildMockMemento())
    await model.transformAndSet(outputFixture)
    expect(model.getSelected()).toStrictEqual(columnsFixture)
  })

  it('should return data that equal the deeply nested output fixture', async () => {
    const model = new ColumnsModel('', buildMockMemento())
    await model.transformAndSet(deeplyNestedOutput)
    expect(model.getSelected()).toStrictEqual(deeplyNestedColumns)
  })
  describe('persistence', () => {
    const paramsDotYamlPath = buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml'
    )
    const testParamPath = appendColumnToPath(paramsDotYamlPath, 'testparam')
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
      const model = new ColumnsModel(exampleDvcRoot, buildMockMemento())
      await model.transformAndSet(exampleData)
      expect(model.getSelected()).toStrictEqual([
        {
          hasChildren: true,
          label: 'params.yaml',
          parentPath: ColumnType.PARAMS,
          path: paramsDotYamlPath,
          type: ColumnType.PARAMS
        },
        {
          hasChildren: false,
          label: 'testparam',
          maxStringLength: 4,
          parentPath: paramsDotYamlPath,
          path: testParamPath,
          pathArray: [ColumnType.PARAMS, 'params.yaml', 'testparam'],
          type: ColumnType.PARAMS,
          types: ['boolean']
        }
      ])
    })

    it('Maintains deselection from persisted status', async () => {
      const model = new ColumnsModel(
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
          label: 'params.yaml',
          parentPath: ColumnType.PARAMS,
          path: paramsDotYamlPath,
          type: ColumnType.PARAMS
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
      const model = new ColumnsModel(
        exampleDvcRoot,
        buildMockMemento({
          [PersistenceKey.METRICS_AND_PARAMS_COLUMN_ORDER + exampleDvcRoot]:
            persistedState
        })
      )
      expect(model.getColumnOrder()).toStrictEqual(persistedState)
    })

    it('should re-order the columns if a new columnOrder is set', () => {
      const model = new ColumnsModel(
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
      const model = new ColumnsModel(
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
      const model = new ColumnsModel(
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
