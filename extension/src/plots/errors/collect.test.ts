import { join } from 'path'
import { collectErrors, collectImageErrors, collectPathErrors } from './collect'
import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'

describe('collectErrors', () => {
  it('should remove errors that belong to revisions that have been fetched', () => {
    const errors = collectErrors(
      { data: {} },
      [EXPERIMENT_WORKSPACE_ID],
      [
        {
          msg: 'unexpected error',
          path: 'fun::plot',
          rev: EXPERIMENT_WORKSPACE_ID
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
          path: 'fun::plot',
          rev: EXPERIMENT_WORKSPACE_ID
        },
        {
          msg: 'unexpected error',
          path: 'fun::plot',
          rev: 'main'
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
          path: 'fun::plot',
          rev: EXPERIMENT_WORKSPACE_ID
        },
        {
          msg: 'unexpected error',
          path: 'fun::plot',
          rev: 'main'
        }
      ],
      { [EXPERIMENT_WORKSPACE_ID]: EXPERIMENT_WORKSPACE_ID, ff2489c: 'main' }
    )

    expect(errors).toStrictEqual([
      { msg: 'new error', path: 'fun::plot', rev: 'main' }
    ])
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
          path: 'fun::plot',
          rev: EXPERIMENT_WORKSPACE_ID
        }
      ],
      { d7ad114: 'main' }
    )

    expect(errors).toStrictEqual([
      { msg: 'Blue screen of death', path: 'fun::plot', rev: 'main' }
    ])
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
        path: otherPath,
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        msg: "Could not find provided field ('ste') in data fields ('step, test/acc').",
        path: otherPath,
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        msg: `${path} not found.`,
        path,
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        msg: `${path} not found.`,
        path,
        rev: 'main'
      }
    ]

    const error = collectImageErrors(path, EXPERIMENT_WORKSPACE_ID, errors)
    expect(error).toStrictEqual([`${path} not found.`])
  })

  it('should return an array of errors', () => {
    const path = join('training', 'plots', 'images', 'mispredicted.jpg')

    const errors = [
      {
        msg: `${path} not found.`,
        path,
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        msg: 'catastrophic error',
        path,
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        msg: 'UNEXPECTEDERRRRROR',
        path,
        rev: EXPERIMENT_WORKSPACE_ID
      }
    ]

    const error = collectImageErrors(path, EXPERIMENT_WORKSPACE_ID, errors)
    expect(error).toStrictEqual([
      `${path} not found.`,
      'catastrophic error',
      'UNEXPECTEDERRRRROR'
    ])
  })
})

describe('collectPathErrorsTable', () => {
  it('should return undefined if the errors do not relate to selected revisions', () => {
    const rev = 'main'
    const path = 'wat'
    const markdownTable = collectPathErrors(
      path,
      [EXPERIMENT_WORKSPACE_ID],
      [
        {
          msg: `${path} not found.`,
          path,
          rev
        },
        {
          msg: 'catastrophic error',
          path,
          rev
        },
        {
          msg: 'UNEXPECTEDERRRRROR',
          path,
          rev
        }
      ]
    )
    expect(markdownTable).toBeUndefined()
  })

  it('should return undefined if the errors do not relate to the path', () => {
    const rev = 'main'
    const path = 'wat'
    const markdownTable = collectPathErrors(
      join('other', 'path'),
      [rev],
      [
        {
          msg: `${path} not found.`,
          path,
          rev
        },
        {
          msg: 'catastrophic error',
          path,
          rev
        },
        {
          msg: 'UNEXPECTEDERRRRROR',
          path,
          rev
        }
      ]
    )
    expect(markdownTable).toBeUndefined()
  })

  it('should return an array of objects containing error messages that relate to the select revision and provided path', () => {
    const rev = 'a-really-long-branch-name'
    const path = 'wat'
    const markdownTable = collectPathErrors(
      path,
      [EXPERIMENT_WORKSPACE_ID, rev],
      [
        {
          msg: `${path} not found.`,
          path,
          rev: EXPERIMENT_WORKSPACE_ID
        },
        {
          msg: 'catastrophic error',
          path,
          rev
        },
        {
          msg: 'UNEXPECTEDERRRRROR',
          path,
          rev
        },
        {
          msg: 'other path not found.',
          path: 'other path',
          rev: EXPERIMENT_WORKSPACE_ID
        }
      ]
    )
    expect(markdownTable).toStrictEqual([
      { msg: 'wat not found.', rev: EXPERIMENT_WORKSPACE_ID },
      { msg: 'catastrophic error', rev },
      { msg: 'UNEXPECTEDERRRRROR', rev }
    ])
  })

  it('should not duplicate entries in the table', () => {
    const path = 'dvc.yaml::Accuracy'
    const msg =
      "Could not find provided field ('acc_') in data fields ('step, acc')."
    const type = 'FieldNotFoundError'
    const duplicateEntry = {
      msg,
      path,
      rev: 'aa1401b',
      type
    }

    const markdownTable = collectPathErrors(
      'dvc.yaml::Accuracy',
      [EXPERIMENT_WORKSPACE_ID, 'main', 'test-plots-diff', 'aa1401b'],
      [
        {
          msg,
          path,
          rev: 'workspace',
          type
        },
        {
          msg,
          path,
          rev: 'test-plots-diff',
          type
        },
        duplicateEntry,
        duplicateEntry
      ]
    )

    expect(markdownTable).toStrictEqual([
      {
        msg,
        rev: EXPERIMENT_WORKSPACE_ID
      },
      {
        msg,
        rev: 'test-plots-diff'
      },
      { msg, rev: 'aa1401b' }
    ])
  })
})
