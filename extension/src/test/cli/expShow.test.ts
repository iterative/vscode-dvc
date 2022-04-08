import { describe, it, suite } from 'mocha'
import isEmpty from 'lodash.isempty'
import omit from 'lodash.omit'
import { expect } from 'chai'
import { TEMP_DIR } from './constants'
import { cliReader, initializeEmptyDvc } from './util'
import { dvcDemoPath } from '../util'

suite('exp show --show-json', () => {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('Demo Repository', () => {
    it('should return the expected output', async () => {
      const output = await cliReader.experimentShow(dvcDemoPath)

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
          key === 'workspace' ? 'null' : 'string'
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
    it('should return the expected output', async () => {
      await initializeEmptyDvc()

      const output = await cliReader.experimentShow(TEMP_DIR)

      expect(
        Object.keys(output),
        'should have at least two entries'
      ).to.have.lengthOf(2)

      const { workspace } = output

      expect(workspace, 'should have a workspace key').not.to.be.undefined

      const data = workspace.baseline.data

      expect(
        data,
        'should have data inside of the workspace baseline'
      ).to.be.an('object')

      expect(data?.timestamp, 'should have a timestamp').to.be.a('null')

      expect(data?.deps, 'should have deps inside of the workspace').to.be.an(
        'object'
      )

      expect(data?.outs, 'should have outs inside of the workspace').to.be.an(
        'object'
      )

      expect(
        data?.metrics,
        'should have metrics inside of the workspace'
      ).to.be.an('object')

      expect(
        data?.params,
        'should not have params inside of the workspace'
      ).to.be.a('undefined')

      for (const obj of Object.values(omit(output, 'workspace'))) {
        expect(obj, 'should have a child object').to.be.an('object')
        expect(obj.baseline, 'should have a baseline entry').to.be.an('object')
      }
    })
  })
})
