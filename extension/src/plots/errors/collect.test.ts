import { join } from 'path'
import { collectErrors, collectImageErrors } from './collect'
import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'

describe('collectErrors', () => {
  it('should remove errors that belong to revisions that have been fetched', () => {
    const errors = collectErrors(
      { data: {} },
      [EXPERIMENT_WORKSPACE_ID],
      [
        {
          msg: 'unexpected error',
          name: 'fun::plot',
          rev: EXPERIMENT_WORKSPACE_ID,
          source: 'metrics.json',
          type: 'unexpected'
        }
      ],
      {}
    )

    expect(errors).toStrictEqual([])
  })

  it('should collect new errors', () => {
    const newError = {
      msg: 'Blue screen of death',
      name: 'fun::plot',
      rev: 'd7ad114',
      source: 'metrics.json',
      type: 'unexpected'
    }

    const errors = collectErrors(
      {
        data: {},
        errors: [newError]
      },
      [EXPERIMENT_WORKSPACE_ID, 'd7ad114'],
      [
        {
          msg: 'unexpected error',
          name: 'fun::plot',
          rev: EXPERIMENT_WORKSPACE_ID,
          source: 'metrics.json',
          type: 'unexpected'
        }
      ],
      { d7ad114: 'main' }
    )

    expect(errors).toStrictEqual([{ ...newError, rev: 'main' }])
  })
})

describe('collectImageErrors', () => {
  it('should return undefined if there are no errors for the image', () => {
    const error = collectImageErrors(
      'misclassified.jpg',
      EXPERIMENT_WORKSPACE_ID,
      []
    )
    expect(error).toBeUndefined()
  })

  it('should collect a single error for an image', () => {
    const path = join('training', 'plots', 'images', 'mispredicted.jpg')
    const otherPath = 'other'

    const errors = [
      {
        msg: `${otherPath} - file type error\nOnly JSON, YAML, CSV and TSV formats are supported.`,
        name: otherPath,
        rev: EXPERIMENT_WORKSPACE_ID,
        source: otherPath,
        type: 'PlotMetricTypeError'
      },
      {
        msg: "Could not find provided field ('ste') in data fields ('step, test/acc').",
        name: otherPath,
        rev: EXPERIMENT_WORKSPACE_ID,
        source: otherPath,
        type: 'FieldNotFoundError'
      },
      {
        msg: '',
        name: path,
        rev: EXPERIMENT_WORKSPACE_ID,
        source: path,
        type: 'FileNotFoundError'
      },
      {
        msg: '',
        name: path,
        rev: 'main',
        source: path,
        type: 'FileNotFoundError'
      }
    ]

    const error = collectImageErrors(path, EXPERIMENT_WORKSPACE_ID, errors)
    expect(error).toStrictEqual(`FileNotFoundError: ${path} not found.`)
  })

  it('should concatenate errors together to give a single string', () => {
    const path = join('training', 'plots', 'images', 'mispredicted.jpg')

    const errors = [
      {
        msg: '',
        name: path,
        rev: EXPERIMENT_WORKSPACE_ID,
        source: path,
        type: 'FileNotFoundError'
      },
      {
        msg: 'catastrophic error',
        name: path,
        rev: EXPERIMENT_WORKSPACE_ID,
        source: path,
        type: 'SomeError'
      },
      {
        msg: '',
        name: path,
        rev: EXPERIMENT_WORKSPACE_ID,
        source: path,
        type: 'UNEXPECTEDERRRRROR'
      }
    ]

    const error = collectImageErrors(path, EXPERIMENT_WORKSPACE_ID, errors)
    expect(error).toStrictEqual(
      `FileNotFoundError: ${path} not found.\nSomeError: catastrophic error\nUNEXPECTEDERRRRROR`
    )
  })
})
