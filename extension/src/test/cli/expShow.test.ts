import { describe, it, suite } from 'mocha'
import isEmpty from 'lodash.isempty'
import { expect } from 'chai'
import { TEMP_DIR } from './constants'
import { dvcReader, initializeDemoRepo, initializeEmptyRepo } from './util'
import { dvcDemoPath } from '../util'
import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'

suite('exp show --show-json', () => {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('Demo Repository', () => {
    it('should return the expected output', async () => {
      await initializeDemoRepo()
      const output = await dvcReader.expShow(dvcDemoPath)

      expect(output.workspace, 'should have a workspace key').not.to.be
        .undefined

      expect(
        Object.keys(output),
        'should have at least two entries'
      ).to.have.lengthOf.greaterThanOrEqual(2)

      // each entry under output
      for (const [key, obj] of Object.entries(output)) {
        expect(obj, 'should have a child object').to.be.an('object')

        expect(obj.baseline, 'should have a baseline entry').to.be.an('object')

        expect(
          obj.baseline.data,
          'should have data inside of the baseline'
        ).to.be.an('object')

        expect(obj.baseline.data?.timestamp, 'should have a timestamp').to.be.a(
          key === EXPERIMENT_WORKSPACE_ID ? 'null' : 'string'
        )

        expect(obj.baseline.data?.params, 'should have params').to.be.an(
          'object'
        )
        expect(obj.baseline.data?.metrics, 'should have metrics').to.be.an(
          'object'
        )

        // each metric or param file
        for (const file of Object.values({
          ...obj.baseline.data?.params,
          ...obj.baseline.data?.metrics
        })) {
          expect(file, 'should have children').to.be.an('object')
          expect(file.data, 'should have a data entry').to.be.an('object')
          expect(isEmpty(file.data), 'should have data').to.be.false
        }

        expect(obj.baseline.data?.metrics, 'should have metrics').to.be.an(
          'object'
        )

        expect(obj.baseline.data?.deps, 'should have deps').to.be.an('object')
        expect(obj.baseline.data?.outs, 'should have outs').to.be.an('object')

        // each deps or outs file
        for (const file of Object.values({
          ...obj.baseline.data?.deps,
          ...obj.baseline.data?.outs
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

      expect(output).to.deep.equal({
        [EXPERIMENT_WORKSPACE_ID]: { baseline: {} }
      })
    })
  })
})
