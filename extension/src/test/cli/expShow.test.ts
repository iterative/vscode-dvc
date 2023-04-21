import { describe, it, suite } from 'mocha'
import isEmpty from 'lodash.isempty'
import { expect } from 'chai'
import { TEMP_DIR } from './constants'
import { dvcReader, initializeDemoRepo, initializeEmptyRepo } from './util'
import { dvcDemoPath } from '../util'
import {
  EXPERIMENT_WORKSPACE_ID,
  fileHasError,
  experimentHasError
} from '../../cli/dvc/contract'
import { ExperimentFlag } from '../../cli/dvc/constants'

suite('exp show --show-json', () => {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('Demo Repository', () => {
    it('should return the expected output', async () => {
      await initializeDemoRepo()
      const output = await dvcReader.expShow(
        dvcDemoPath,
        ExperimentFlag.NUM_COMMIT,
        '3'
      )

      const [workspace, ...commits] = output

      expect(workspace, 'should have a workspace key').not.to.be.undefined

      expect(
        Object.keys(output),
        'should have an entry for each commit and one for the workspace'
      ).to.have.lengthOf(4)

      for (const commit of commits) {
        if (experimentHasError(commit)) {
          throw new Error('Commit should not have an error')
          continue
        }

        expect(commit, 'should have a child object').to.be.an('object')

        expect(commit, 'should have a baseline entry').to.be.an('object')

        expect(commit.data, 'should have data inside of the baseline').to.be.an(
          'object'
        )

        expect(commit.data.timestamp, 'should have a timestamp').to.be.a(
          'string'
        )

        expect(commit.data.params, 'should have params').to.be.an('object')
        expect(commit.data.metrics, 'should have metrics').to.be.an('object')

        for (const file of Object.values({
          ...commit.data.params,
          ...commit.data.metrics
        })) {
          expect(file, 'should have children').to.be.an('object')
          if (fileHasError(file)) {
            throw new Error('File should not have an error')
          }
          expect(file.data, 'should have a data entry').to.be.an('object')
          expect(isEmpty(file.data), 'should have data').to.be.false
        }

        expect(commit.data.deps, 'should have deps').to.be.an('object')
        expect(commit.data.outs, 'should have outs').to.be.an('object')

        for (const file of Object.values({
          ...commit.data?.deps,
          ...commit.data?.outs
        })) {
          expect(file.hash, 'should have a hash').to.be.a('string')
          expect(file.size, 'should have a size').to.be.a('number')
          expect(
            file.nfiles,
            'should have an nfiles entry (which can be null)'
          ).to.be.an(file.nfiles ? 'number' : 'null')
        }
      }
    })
  })

  describe('Empty Repository', () => {
    it('should return the default output', async () => {
      await initializeEmptyRepo()
      const output = await dvcReader.expShow(TEMP_DIR)

      expect(output).to.deep.equal([
        {
          rev: EXPERIMENT_WORKSPACE_ID
        }
      ])
    })
  })
})
