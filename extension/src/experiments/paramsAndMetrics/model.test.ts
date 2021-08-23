import { EventEmitter } from 'vscode'
import { MementoPrefixes, ParamsAndMetricsModel, Status } from './model'
import { buildMockMemento } from '../../test/util'

jest.mock('vscode', () => ({
  EventEmitter: function (this: EventEmitter<void>) {
    this.fire = () => {}
  }
}))

describe('paramsAndMetrics', () => {
  describe('persistence', () => {
    it('Shows all items when given no persisted status', async () => {
      const exampleDvcRoot = 'test'

      const model = new ParamsAndMetricsModel(
        exampleDvcRoot,
        buildMockMemento()
      )
      await model.transformAndSet({
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
      })
      expect(model.getSelected()).toEqual([
        {
          group: 'params',
          hasChildren: false,
          maxStringLength: 4,
          name: 'testparam',
          parentPath: 'params/params.yaml',
          path: 'params/params.yaml/testparam',
          types: ['boolean']
        },
        {
          group: 'params',
          hasChildren: true,
          name: 'params.yaml',
          parentPath: 'params',
          path: 'params/params.yaml'
        }
      ])
    })

    it('Maintains deselection from persisted status', async () => {
      const exampleDvcRoot = 'test'

      const model = new ParamsAndMetricsModel(
        exampleDvcRoot,
        buildMockMemento({
          [MementoPrefixes.status + exampleDvcRoot]: {
            'params/params.yaml/testparam': Status.unselected
          }
        })
      )
      await model.transformAndSet({
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
      })
      expect(model.getSelected()).toEqual([
        {
          group: 'params',
          hasChildren: true,
          name: 'params.yaml',
          parentPath: 'params',
          path: 'params/params.yaml'
        }
      ])
    })
  })
})
