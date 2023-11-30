import { join } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { ColumnsModel } from './model'
import { appendColumnToPath, buildMetricOrParamPath } from './paths'
import { EXPERIMENT_COLUMN_ID, timestampColumn } from './constants'
import { buildMockMemento } from '../../test/util'
import { generateTestExpShowOutput } from '../../test/util/experiments'
import { Status } from '../../path/selection/model'
import { PersistenceKey } from '../../persistence/constants'
import { ColumnType } from '../webview/contract'
import outputFixture from '../../test/fixtures/expShow/base/output'
import columnsFixture from '../../test/fixtures/expShow/base/columns'
import {
  deeplyNestedColumnsWithHeightOf10,
  deeplyNestedColumnsWithHeightOf3,
  deeplyNestedColumnsWithHeightOf2,
  deeplyNestedColumnsWithHeightOf1
} from '../../test/fixtures/expShow/deeplyNested/maxHeight'
import deeplyNestedColumnsFixture from '../../test/fixtures/expShow/deeplyNested/columns'
import deeplyNestedOutputFixture from '../../test/fixtures/expShow/deeplyNested/output'
import dataTypesColumnsFixture from '../../test/fixtures/expShow/dataTypes/columns'
import dataTypesOutputFixture from '../../test/fixtures/expShow/dataTypes/output'
import survivalOutputFixture from '../../test/fixtures/expShow/survival/output'
import survivalColumnsFixture from '../../test/fixtures/expShow/survival/columns'
import { getConfigValue } from '../../vscode/config'
import { buildMockedEventEmitter } from '../../test/util/jest'

jest.mock('../../vscode/config')
jest.mock('@hediet/std/disposable')

const mockedGetConfigValue = jest.mocked(getConfigValue)
const mockedDisposable = jest.mocked(Disposable)

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetConfigValue.mockReturnValue(5)

  mockedDisposable.fn.mockReturnValue({
    track: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)
})

describe('ColumnsModel', () => {
  const exampleDvcRoot = 'test'
  const mockedColumnsOrderOrStatusChanged = buildMockedEventEmitter<void>()

  it('should return the timestamp column when given output with no params, metrics or deps', async () => {
    const model = new ColumnsModel(
      '',
      buildMockMemento(),
      mockedColumnsOrderOrStatusChanged
    )
    await model.transformAndSet(generateTestExpShowOutput({}))

    expect(model.getSelected()).toStrictEqual([timestampColumn])
  })

  it('should return the expected columns when given the default output fixture', async () => {
    const model = new ColumnsModel(
      '',
      buildMockMemento(),
      mockedColumnsOrderOrStatusChanged
    )
    await model.transformAndSet(outputFixture)
    expect(mockedGetConfigValue).toHaveBeenCalled()
    expect(model.getSelected()).toStrictEqual(columnsFixture)
  })

  it('should return the expected columns when given the survival output fixture', async () => {
    const model = new ColumnsModel(
      '',
      buildMockMemento(),
      mockedColumnsOrderOrStatusChanged
    )
    await model.transformAndSet(survivalOutputFixture)
    expect(model.getSelected()).toStrictEqual(survivalColumnsFixture)
  })

  it('should return the expected columns when given the deeply nested output fixture', async () => {
    const model = new ColumnsModel(
      '',
      buildMockMemento(),
      mockedColumnsOrderOrStatusChanged
    )
    await model.transformAndSet(deeplyNestedOutputFixture)
    expect(mockedGetConfigValue).toHaveBeenCalled()
    expect(model.getSelected()).toStrictEqual(deeplyNestedColumnsFixture)
  })

  it('should return the expected columns when the max depth config is set to 10', async () => {
    mockedGetConfigValue.mockReturnValue(10)
    const model = new ColumnsModel(
      '',
      buildMockMemento(),
      mockedColumnsOrderOrStatusChanged
    )
    await model.transformAndSet(deeplyNestedOutputFixture)
    expect(mockedGetConfigValue).toHaveBeenCalled()
    expect(model.getSelected()).toStrictEqual(deeplyNestedColumnsWithHeightOf10)
  })

  it('should return the expected columns when the max depth config is set to 3', async () => {
    mockedGetConfigValue.mockReturnValue(3)
    const model = new ColumnsModel(
      '',
      buildMockMemento(),
      mockedColumnsOrderOrStatusChanged
    )
    await model.transformAndSet(deeplyNestedOutputFixture)
    expect(mockedGetConfigValue).toHaveBeenCalled()
    expect(model.getSelected()).toStrictEqual(deeplyNestedColumnsWithHeightOf3)
  })

  it('should return the expected columns when the max depth config is set to 2', async () => {
    mockedGetConfigValue.mockReturnValue(2)
    const model = new ColumnsModel(
      '',
      buildMockMemento(),
      mockedColumnsOrderOrStatusChanged
    )
    await model.transformAndSet(deeplyNestedOutputFixture)
    expect(mockedGetConfigValue).toHaveBeenCalled()
    expect(model.getSelected()).toStrictEqual(deeplyNestedColumnsWithHeightOf2)
  })

  it('should return the expected columns when the max depth config is set to 1', async () => {
    mockedGetConfigValue.mockReturnValue(1)
    const model = new ColumnsModel(
      '',
      buildMockMemento(),
      mockedColumnsOrderOrStatusChanged
    )
    await model.transformAndSet(deeplyNestedOutputFixture)
    expect(mockedGetConfigValue).toHaveBeenCalled()

    expect(model.getSelected()).toStrictEqual(deeplyNestedColumnsWithHeightOf1)
  })

  it('should return the expected columns when the max depth config is set to 0', async () => {
    mockedGetConfigValue.mockReturnValue(0)
    const model = new ColumnsModel(
      '',
      buildMockMemento(),
      mockedColumnsOrderOrStatusChanged
    )
    await model.transformAndSet(deeplyNestedOutputFixture)
    expect(mockedGetConfigValue).toHaveBeenCalled()
    expect(model.getSelected()).toStrictEqual(deeplyNestedColumnsWithHeightOf10)
  })

  it('should return the expected columns when the max depth config is set to -1', async () => {
    mockedGetConfigValue.mockReturnValue(-1)
    const model = new ColumnsModel(
      '',
      buildMockMemento(),
      mockedColumnsOrderOrStatusChanged
    )
    await model.transformAndSet(deeplyNestedOutputFixture)
    expect(mockedGetConfigValue).toHaveBeenCalled()
    expect(model.getSelected()).toStrictEqual(deeplyNestedColumnsWithHeightOf10)
  })

  it('should return the expected columns when given the data types output fixture', async () => {
    const model = new ColumnsModel(
      '',
      buildMockMemento(),
      mockedColumnsOrderOrStatusChanged
    )
    await model.transformAndSet(dataTypesOutputFixture)
    expect(model.getSelected()).toStrictEqual(dataTypesColumnsFixture)
  })

  describe('persistence', () => {
    const paramsDotYamlPath = buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml'
    )
    const testParamPath = appendColumnToPath(paramsDotYamlPath, 'testParam')
    const exampleData = generateTestExpShowOutput({
      params: {
        'params.yaml': {
          data: {
            testParam: true
          }
        }
      }
    })

    it('Shows all items when given no persisted status', async () => {
      const model = new ColumnsModel(
        exampleDvcRoot,
        buildMockMemento(),
        mockedColumnsOrderOrStatusChanged
      )
      await model.transformAndSet(exampleData)
      expect(model.getSelected()).toStrictEqual([
        timestampColumn,
        {
          hasChildren: true,
          label: 'params.yaml',
          parentPath: ColumnType.PARAMS,
          path: paramsDotYamlPath,
          type: ColumnType.PARAMS
        },
        {
          firstValueType: 'boolean',
          hasChildren: false,
          label: 'testParam',
          parentPath: paramsDotYamlPath,
          path: testParamPath,
          pathArray: [ColumnType.PARAMS, 'params.yaml', 'testParam'],
          type: ColumnType.PARAMS
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
        }),
        mockedColumnsOrderOrStatusChanged
      )
      await model.transformAndSet(exampleData)
      expect(model.getSelected()).toStrictEqual([
        timestampColumn,
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
        }),
        mockedColumnsOrderOrStatusChanged
      )
      expect(model.getColumnOrder()).toStrictEqual(persistedState)
    })

    it('should return the first three visible columns for both metrics and params from the persisted state (first)', async () => {
      const persistedState = [
        'id',
        'Created',
        'params:params.yaml:dvc_logs_dir',
        'params:params.yaml:process.threshold',
        'params:params.yaml:process.test_arg',
        'params:params.yaml:dropout',
        'metrics:summary.json:loss',
        'metrics:summary.json:accuracy',
        'deps:src/prepare.py',
        'deps:src/featurization.py'
      ]

      const model = new ColumnsModel(
        exampleDvcRoot,
        buildMockMemento({
          [PersistenceKey.METRICS_AND_PARAMS_COLUMN_ORDER + exampleDvcRoot]:
            persistedState
        }),
        mockedColumnsOrderOrStatusChanged
      )
      await model.transformAndSet(outputFixture)

      expect(model.getSummaryColumnOrder()).toStrictEqual([
        'params:params.yaml:dvc_logs_dir',
        'params:params.yaml:process.threshold',
        'params:params.yaml:process.test_arg',
        'metrics:summary.json:loss',
        'metrics:summary.json:accuracy',
        'metrics:summary.json:val_accuracy'
      ])

      model.toggleStatus('params:params.yaml:dvc_logs_dir')

      expect(model.getSummaryColumnOrder()).toStrictEqual([
        'params:params.yaml:process.threshold',
        'params:params.yaml:process.test_arg',
        'params:params.yaml:dropout',
        'metrics:summary.json:loss',
        'metrics:summary.json:accuracy',
        'metrics:summary.json:val_accuracy'
      ])
    })

    it('should not add a param that is no longer present to the summary column order', async () => {
      const persistedState = [
        'id',
        'Created',
        'params:params.yaml:an-old-params'
      ]

      const model = new ColumnsModel(
        exampleDvcRoot,
        buildMockMemento({
          [PersistenceKey.METRICS_AND_PARAMS_COLUMN_ORDER + exampleDvcRoot]:
            persistedState
        }),
        mockedColumnsOrderOrStatusChanged
      )
      model.toggleStatus('params:params.yaml:an-old-params')
      await model.transformAndSet(outputFixture)

      expect(model.getSummaryColumnOrder()).toStrictEqual([
        join('params:nested', 'params.yaml:test'),
        'params:params.yaml:code_names',
        'params:params.yaml:dropout',
        'metrics:summary.json:accuracy',
        'metrics:summary.json:loss',
        'metrics:summary.json:val_accuracy'
      ])
    })

    it('should add to the persisted state when there are columns that were not found', async () => {
      const persistedState = ['params:params.yaml:dvc_logs_dir']

      const model = new ColumnsModel(
        exampleDvcRoot,
        buildMockMemento({
          [PersistenceKey.METRICS_AND_PARAMS_COLUMN_ORDER + exampleDvcRoot]:
            persistedState
        }),
        mockedColumnsOrderOrStatusChanged
      )
      await model.transformAndSet(outputFixture)

      expect(model.getSummaryColumnOrder()).toStrictEqual([
        'params:params.yaml:dvc_logs_dir',
        join('params:nested', 'params.yaml:test'),
        'params:params.yaml:code_names',
        'metrics:summary.json:accuracy',
        'metrics:summary.json:loss',
        'metrics:summary.json:val_accuracy'
      ])

      const [id] = model.getColumnOrder()
      expect(id).toStrictEqual(EXPERIMENT_COLUMN_ID)
    })

    it('should return the first three metric and param columns (none hidden) collected from data if state is empty', async () => {
      const model = new ColumnsModel(
        exampleDvcRoot,
        buildMockMemento(),
        mockedColumnsOrderOrStatusChanged
      )
      await model.transformAndSet(outputFixture)

      expect(model.getSummaryColumnOrder()).toStrictEqual([
        join('params:nested', 'params.yaml:test'),
        'params:params.yaml:code_names',
        'params:params.yaml:dropout',
        'metrics:summary.json:accuracy',
        'metrics:summary.json:loss',
        'metrics:summary.json:val_accuracy'
      ])

      model.toggleStatus('params:params.yaml:code_names')

      expect(model.getSummaryColumnOrder()).toStrictEqual([
        join('params:nested', 'params.yaml:test'),
        'params:params.yaml:dropout',
        'params:params.yaml:dvc_logs_dir',
        'metrics:summary.json:accuracy',
        'metrics:summary.json:loss',
        'metrics:summary.json:val_accuracy'
      ])
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
        }),
        mockedColumnsOrderOrStatusChanged
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
        }),
        mockedColumnsOrderOrStatusChanged
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
        }),
        mockedColumnsOrderOrStatusChanged
      )
      const changedColumnId = 'C'
      const expectedWidth = 77

      model.setColumnWidth(changedColumnId, expectedWidth)

      expect(model.getColumnWidths()[changedColumnId]).toBe(expectedWidth)
    })
  })

  describe('columns selection', () => {
    const expectStatus = (
      columns: Array<{ status: Status }>,
      expectedStatus: Status
    ) => {
      for (const { status } of columns) {
        expect(status).toStrictEqual(expectedStatus)
      }
    }

    it('should unselect the children of a unselected column', async () => {
      const mockMemento = buildMockMemento({
        [PersistenceKey.METRICS_AND_PARAMS_STATUS + exampleDvcRoot]: {}
      })
      const model = new ColumnsModel(
        exampleDvcRoot,
        mockMemento,
        mockedColumnsOrderOrStatusChanged
      )
      await model.transformAndSet(outputFixture)
      expect(model.getSelected()).toStrictEqual(columnsFixture)

      const parentPath = 'params:params.yaml:process'
      model.toggleStatus(parentPath)
      const children = model.getChildren(parentPath)
      expectStatus(children, Status.UNSELECTED)
    })

    it('should select the children of a selected column', async () => {
      const parentPath = 'params:params.yaml:process'
      const mockMemento = buildMockMemento({
        [PersistenceKey.METRICS_AND_PARAMS_STATUS + exampleDvcRoot]: {
          [parentPath]: Status.UNSELECTED
        }
      })
      const model = new ColumnsModel(
        exampleDvcRoot,
        mockMemento,
        mockedColumnsOrderOrStatusChanged
      )
      await model.transformAndSet(outputFixture)
      expect(model.getSelected()).not.toStrictEqual(columnsFixture)

      model.toggleStatus(parentPath)

      const children = model.getChildren(parentPath)
      expectStatus(children, Status.SELECTED)
    })

    it('should unselect the children of an indeterminate column when it is unselected', async () => {
      const mockMemento = buildMockMemento({
        [PersistenceKey.METRICS_AND_PARAMS_STATUS + exampleDvcRoot]: {}
      })
      const model = new ColumnsModel(
        exampleDvcRoot,
        mockMemento,
        mockedColumnsOrderOrStatusChanged
      )
      await model.transformAndSet(outputFixture)
      expect(model.getSelected()).toStrictEqual(columnsFixture)

      const parentPath = 'metrics:summary.json'
      model.toggleStatus('metrics:summary.json:val_loss')
      model.unselect(parentPath)

      const children = model.getChildren(parentPath)
      expectStatus(children, Status.UNSELECTED)
    })
  })
})
