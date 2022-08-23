import { describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { TEMP_DIR } from './constants'
import { dvcReader, initializeDemoRepo, initializeEmptyRepo } from './util'
import { dvcDemoPath } from '../util'
import {
  ImagePlot,
  isImagePlot,
  PlotsType,
  TemplatePlot
} from '../../plots/webview/contract'

suite('plots diff -o <TEMP_DIR> --split --show-json', () => {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('Demo Repository', () => {
    it('should return the expected output', async () => {
      await initializeDemoRepo()
      const output = await dvcReader.plotsDiff(dvcDemoPath)

      expect(output, 'should be an object').to.be.an('object')

      expect(
        Object.keys(output),
        'should have four plot paths'
      ).to.have.lengthOf(4)

      // each set of plots under a path
      for (const plots of Object.values(output)) {
        expect(plots, 'should have plots under each path').to.be.an('array')
        expect(
          plots,
          'should have at least one plot'
        ).to.have.lengthOf.greaterThanOrEqual(1)

        // each plot
        const expectImage = (plot: ImagePlot) => {
          expect(plot.url).to.be.a('string')
          expect(plot.revisions, 'should have one revision').to.have.lengthOf(1)
        }

        const expectTemplate = (plot: TemplatePlot) => {
          expect(plot?.datapoints, 'should have a datapoints object').to.be.an(
            'object'
          )

          expect(plot.revisions, 'should have two revisions').to.have.lengthOf(
            2
          )

          const datapoints = plot?.datapoints || {}
          expect(
            Object.keys(datapoints),
            'should have the HEAD and workspace revisions'
          ).to.have.lengthOf(2)

          for (const revisionDatapoints of Object.values(datapoints)) {
            expect(revisionDatapoints).to.be.an('array')
            for (const datapoint of revisionDatapoints) {
              expect(
                datapoint,
                'should have an object of unknown type for each datapoint'
              ).to.be.an('object')
            }
          }
        }

        for (const plot of plots) {
          expect(plot, 'should be an object').to.be.an('object')
          expect(
            Object.values(PlotsType).includes(plot.type),
            'should have a recognized type'
          ).to.be.true
          expect(plot.revisions, 'should have a revisions array').to.be.an(
            'array'
          )

          if (isImagePlot(plot)) {
            expectImage(plot)
          } else {
            expectTemplate(plot)
          }
        }
      }
    })
  })

  describe('Empty Repository', () => {
    it('should return the expected output', async () => {
      await initializeEmptyRepo()
      const output = await dvcReader.plotsDiff(TEMP_DIR)

      expect(output).deep.equal({})
    })
  })
})
