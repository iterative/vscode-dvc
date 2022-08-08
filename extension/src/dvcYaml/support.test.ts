import { DvcYamlSupport, DvcYamlSupportWorkspace } from './support'
import {
  dvcYamlWithVars,
  getStartedDvcYaml,
  minimal,
  paramsYaml
} from '../test/fixtures/dvcYaml/dvcYamls'

const testSpecificYaml = async (yamlTxt: string, expectedFiles: string[]) => {
  const mockWorkspace: DvcYamlSupportWorkspace = {
    findFiles: jest.fn(),
    findPaths: jest.fn()
  }

  const support = new DvcYamlSupport(mockWorkspace, yamlTxt)
  await support.init()

  expect(mockWorkspace.findFiles).toBeCalledWith(expectedFiles)
}

describe('DvcYamlSupport', () => {
  // eslint-disable-next-line jest/expect-expect
  it('should parse the workspace files referenced in the dvc.yaml', async () => {
    await testSpecificYaml(getStartedDvcYaml, [
      'params.yaml',
      'evaluation.json'
    ])
    await testSpecificYaml(dvcYamlWithVars, [
      'params.yaml',
      'custom_params.yaml',
      'params.json',
      'config/myapp.yaml'
    ])
    await testSpecificYaml(minimal, ['params.yaml'])
  })

  describe('completions', () => {
    it('should give suggestions based on the referenced file contents', async () => {
      const mockWorkspace: DvcYamlSupportWorkspace = {
        findFiles() {
          return Promise.resolve([
            {
              contents: paramsYaml,
              path: 'params.yaml'
            }
          ])
        },
        findPaths: jest.fn()
      }

      const support = new DvcYamlSupport(mockWorkspace, dvcYamlWithVars)
      await support.init()

      expect(support.provideCompletions('feat')).toStrictEqual([
        {
          completion: 'featurize',
          label: 'featurize'
        }
      ])
      expect(support.provideCompletions('prep')).toStrictEqual([
        {
          completion: 'prepare',
          label: 'prepare'
        }
      ])
      const variations = [
        'featurize.',
        '  featurize.',
        '\tfeaturize.',
        '\t- featurize.',
        '\tcmd: echo ${featurize.',
        '\tcmd: echo ${ featurize.'
      ]

      for (const variation of variations) {
        expect(support.provideCompletions(variation)).toStrictEqual([
          { completion: 'featurize.max_features', label: 'max_features' },
          { completion: 'featurize.ngrams', label: 'ngrams' }
        ])
      }
      expect(support.provideCompletions('featurize.n')).toStrictEqual([
        { completion: 'featurize.ngrams', label: 'ngrams' }
      ])

      expect(support.provideCompletions('mod')).toStrictEqual([
        { completion: 'models', label: 'models' },
        { completion: 'model', label: 'model' }
      ])

      expect(support.provideCompletions('models.')).toStrictEqual([
        { completion: 'models.us', label: 'us' }
      ])

      expect(support.provideCompletions('models.us.')).toStrictEqual([
        { completion: 'models.us.threshold', label: 'threshold' }
      ])
    })
  })
})
