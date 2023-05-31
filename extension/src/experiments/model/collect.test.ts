import { collectExperiments } from './collect'
import { generateTestExpShowOutput } from '../../test/util/experiments'

describe('collectExperiments', () => {
  it('should return an empty array if no commits are present', () => {
    const { commits } = collectExperiments(generateTestExpShowOutput({}), false)
    expect(commits).toStrictEqual([])
  })

  const expShowWithTwoCommits = generateTestExpShowOutput(
    {},
    {
      experiments: [{}, {}],
      name: 'branchA',
      rev: '61bed4ce8913eca7f73ca754d65bc5daad1520e2'
    },
    {
      name: 'branchB',
      rev: '351e42ace3cb6a3a853c65bef285e60748cc6341'
    }
  )

  it('should define a workspace', () => {
    const { workspace } = collectExperiments(expShowWithTwoCommits, false)

    expect(workspace).toBeDefined()
  })

  it('should find two branches from a repo with two branches', () => {
    const { commits } = collectExperiments(expShowWithTwoCommits, false)

    expect(commits.length).toStrictEqual(2)
  })

  it('should list commits in the same order as they are collected', () => {
    const { commits } = collectExperiments(expShowWithTwoCommits, false)
    const [commitA, commitB] = commits

    expect(commitA.id).toStrictEqual('branchA')
    expect(commitB.id).toStrictEqual('branchB')
  })

  it('should find two experiments on commitA', () => {
    const { experimentsByCommit } = collectExperiments(
      expShowWithTwoCommits,
      false
    )
    expect(experimentsByCommit.get('branchA')?.length).toStrictEqual(2)
  })

  it('should find no experiments on branchB', () => {
    const { experimentsByCommit } = collectExperiments(
      expShowWithTwoCommits,
      false
    )
    expect(experimentsByCommit.get('branchB')).toBeUndefined()
  })

  it('should not collect the same experiment twice', () => {
    const main = {
      experiments: [
        {
          name: 'campy-pall',
          rev: '0b4b001dfaa8f2c4cd2a62238699131ab2c679ea'
        },
        {
          name: 'shyer-stir',
          rev: '450e672f0d8913517ab2ab443f5d87b34f308290'
        }
      ],
      name: 'main',
      rev: '61bed4ce8913eca7f73ca754d65bc5daad1520e2'
    }

    const expShowWithDuplicateCommits = generateTestExpShowOutput(
      {},
      main,
      {
        name: 'branchOffMainWithCommit',
        rev: '351e42ace3cb6a3a853c65bef285e60748cc6341'
      },
      main
    )

    const { experimentsByCommit, commits } = collectExperiments(
      expShowWithDuplicateCommits,
      false
    )

    expect(commits.length).toStrictEqual(3)

    const experiments = experimentsByCommit.get('main')

    expect(experiments?.length).toStrictEqual(2)
    expect(experiments?.map(({ id }) => id).sort()).toStrictEqual([
      'campy-pall',
      'shyer-stir'
    ])
  })
})
