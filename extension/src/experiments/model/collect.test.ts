import { collectExperiments, collectRemoteExpRefs } from './collect'
import { generateTestExpShowOutput } from '../../test/util/experiments'
import { ExpShowOutput } from '../../cli/dvc/contract'

const DEFAULT_DATA: [string, boolean] = ['', false]

describe('collectExperiments', () => {
  it('should return an empty array if no commits are present', () => {
    const { commits } = collectExperiments(
      generateTestExpShowOutput({}),
      ...DEFAULT_DATA
    )
    expect(commits).toStrictEqual([])
  })

  const expShowWithTwoCommits: [ExpShowOutput, string, boolean] = [
    generateTestExpShowOutput(
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
    ),
    ...DEFAULT_DATA
  ]

  it('should define a workspace', () => {
    const { workspace } = collectExperiments(...expShowWithTwoCommits)

    expect(workspace).toBeDefined()
  })

  it('should find two branches from a repo with two branches', () => {
    const { commits } = collectExperiments(...expShowWithTwoCommits)

    expect(commits.length).toStrictEqual(2)
  })

  it('should list commits in the same order as they are collected', () => {
    const { commits } = collectExperiments(...expShowWithTwoCommits)
    const [commitA, commitB] = commits

    expect(commitA.id).toStrictEqual('branchA')
    expect(commitB.id).toStrictEqual('branchB')
  })

  it('should find two experiments on commitA', () => {
    const { experimentsByCommit } = collectExperiments(...expShowWithTwoCommits)
    expect(experimentsByCommit.get('branchA')?.length).toStrictEqual(2)
  })

  it('should find no experiments on branchB', () => {
    const { experimentsByCommit } = collectExperiments(...expShowWithTwoCommits)
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
      ...DEFAULT_DATA
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

describe('collectRemoteExpRefs', () => {
  it('should parse the git ls-remote output', () => {
    const output = `263e4408e42a0e215b0f70b36b2ab7b65a160d7e        refs/exps/a9/b32d14966b9be1396f2211d9eb743359708a07/vital-taal
    d4f2a35773ead55b7ce4b596f600e98360e49372        refs/exps/a9/b32d14966b9be1396f2211d9eb743359708a07/whole-bout
    5af79e8d5e53f4e41221b6a166121d96d50b630a        refs/exps/a9/d8057e088d46842f15c3b6d1bb2e4befd5f677/deism-bots
    21745a4aa76daf59b49ec81480fe7a89c7ea8fb2        refs/exps/a9/d8057e088d46842f15c3b6d1bb2e4befd5f677/inter-gulf
    390aef747f45fc49ec8928b24771f8950d057393        refs/exps/a9/d8057e088d46842f15c3b6d1bb2e4befd5f677/known-flus
    142a803b83ff784ba1106cc4ad0ba03310da6186        refs/exps/a9/d8057e088d46842f15c3b6d1bb2e4befd5f677/tight-lira
    21ce298cd1743405a0d73f5cb4cf52289ffa3276        refs/exps/bf/6ca8a35911bc6e62fb9bcaa506d4f4e185450c/crumb-orcs`
    const remoteExpShas = collectRemoteExpRefs(output)
    expect(remoteExpShas).toStrictEqual(
      new Set([
        '263e4408e42a0e215b0f70b36b2ab7b65a160d7e',
        'd4f2a35773ead55b7ce4b596f600e98360e49372',
        '5af79e8d5e53f4e41221b6a166121d96d50b630a',
        '21745a4aa76daf59b49ec81480fe7a89c7ea8fb2',
        '390aef747f45fc49ec8928b24771f8950d057393',
        '142a803b83ff784ba1106cc4ad0ba03310da6186',
        '21ce298cd1743405a0d73f5cb4cf52289ffa3276'
      ])
    )
  })
})
