import { join } from 'path'
import {
  collectErrors,
  collectImageErrors,
  collectPathErrorsTable
} from './collect'
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

  it('should correctly handle the cliIdToLabel mapping for removing existing errors', () => {
    const errors = collectErrors(
      { data: {} },
      [EXPERIMENT_WORKSPACE_ID, 'ff2489c'],
      [
        {
          msg: 'unexpected error',
          name: 'fun::plot',
          rev: EXPERIMENT_WORKSPACE_ID,
          source: 'metrics.json',
          type: 'unexpected'
        },
        {
          msg: 'unexpected error',
          name: 'fun::plot',
          rev: 'main',
          source: 'metrics.json',
          type: 'unexpected'
        }
      ],
      { [EXPERIMENT_WORKSPACE_ID]: EXPERIMENT_WORKSPACE_ID, ff2489c: 'main' }
    )

    expect(errors).toStrictEqual([])
  })

  it('should correctly handle the cliIdToLabel mapping for replacing errors', () => {
    const newError = {
      msg: 'new error',
      name: 'fun::plot',
      rev: 'ff2489c',
      source: 'metrics.json',
      type: 'unexpected'
    }

    const errors = collectErrors(
      { data: {}, errors: [newError] },
      [EXPERIMENT_WORKSPACE_ID, 'ff2489c'],
      [
        {
          msg: 'unexpected error',
          name: 'fun::plot',
          rev: EXPERIMENT_WORKSPACE_ID,
          source: 'metrics.json',
          type: 'unexpected'
        },
        {
          msg: 'unexpected error',
          name: 'fun::plot',
          rev: 'main',
          source: 'metrics.json',
          type: 'unexpected'
        }
      ],
      { [EXPERIMENT_WORKSPACE_ID]: EXPERIMENT_WORKSPACE_ID, ff2489c: 'main' }
    )

    expect(errors).toStrictEqual([{ ...newError, rev: 'main' }])
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
    expect(error).toStrictEqual(`${path} not found.`)
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
      `${path} not found.\ncatastrophic error\nUNEXPECTEDERRRRROR`
    )
  })
})

describe('collectPathErrorsTable', () => {
  it('should return undefined if the errors do not relate to selected revisions', () => {
    const rev = 'main'
    const path = 'wat'
    const markdownTable = collectPathErrorsTable(
      path,
      [EXPERIMENT_WORKSPACE_ID],
      [
        {
          msg: '',
          name: path,
          rev,
          source: path,
          type: 'FileNotFoundError'
        },
        {
          msg: 'catastrophic error',
          name: path,
          rev,
          source: path,
          type: 'SomeError'
        },
        {
          msg: '',
          name: path,
          rev,
          source: path,
          type: 'UNEXPECTEDERRRRROR'
        }
      ]
    )
    expect(markdownTable).toBeUndefined()
  })

  it('should return undefined if the errors do not relate to the path', () => {
    const rev = 'main'
    const path = 'wat'
    const markdownTable = collectPathErrorsTable(
      join('other', 'path'),
      [rev],
      [
        {
          msg: '',
          name: path,
          rev,
          source: path,
          type: 'FileNotFoundError'
        },
        {
          msg: 'catastrophic error',
          name: path,
          rev,
          source: path,
          type: 'SomeError'
        },
        {
          msg: '',
          name: path,
          rev,
          source: path,
          type: 'UNEXPECTEDERRRRROR'
        }
      ]
    )
    expect(markdownTable).toBeUndefined()
  })

  it('should construct a markdown table with the error if they relate to the select revision and provided path', () => {
    const rev = 'a-really-long-branch-name'
    const path = 'wat'
    const markdownTable = collectPathErrorsTable(
      path,
      [EXPERIMENT_WORKSPACE_ID, rev],
      [
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
          rev,
          source: path,
          type: 'SomeError'
        },
        {
          msg: '',
          name: path,
          rev,
          source: path,
          type: 'UNEXPECTEDERRRRROR'
        }
      ]
    )
    expect(markdownTable).toStrictEqual(
      'Errors\n' +
        '|||\n' +
        '|--|--|\n' +
        '| a-really... | UNEXPECTEDERRRRROR |\n' +
        '| a-really... | catastrophic error |\n' +
        '| workspace | wat not found. |'
    )
  })

  it('should not duplicate entries in the table', () => {
    const name = 'dvc.yaml::Accuracy'
    const msg =
      "Could not find provided field ('acc_') in data fields ('step, acc')."
    const type = 'FieldNotFoundError'
    const duplicateEntry = {
      msg,
      name,
      rev: 'aa1401b',
      type
    }

    const markdownTable = collectPathErrorsTable(
      'dvc.yaml::Accuracy',
      [EXPERIMENT_WORKSPACE_ID, 'main', 'test-plots-diff', 'aa1401b'],
      [
        {
          msg,
          name,
          rev: 'workspace',
          type
        },
        {
          msg,
          name,
          rev: 'test-plots-diff',
          type
        },
        duplicateEntry,
        duplicateEntry
      ]
    )

    expect(markdownTable).toStrictEqual(
      'Errors\n' +
        '|||\n' +
        '|--|--|\n' +
        "| aa1401b | Could not find provided field ('acc_') in data fields ('step, acc'). |\n" +
        "| test-plo... | Could not find provided field ('acc_') in data fields ('step, acc'). |\n" +
        "| workspace | Could not find provided field ('acc_') in data fields ('step, acc'). |"
    )
  })
})
