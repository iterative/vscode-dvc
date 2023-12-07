import { describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { TEMP_DIR } from './constants'
import { dvcReader, initializeDemoRepo, initializeEmptyRepo } from './util'
import { dvcDemoPath } from '../util'
import { ImagePlot } from '../../plots/webview/contract'
import {
  PLOT_ANCHORS,
  EXPERIMENT_WORKSPACE_ID,
  PlotsOutput,
  PlotsType,
  TemplatePlotOutput,
  isImagePlotOutput
} from '../../cli/dvc/contract'
import { isDvcError } from '../../cli/dvc/reader'

suite('plots diff -o <TEMP_DIR> --split --show-json', () => {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('Demo Repository', () => {
    it('should return the expected output', async () => {
      await initializeDemoRepo()
      const revisionsRequiredForSubmodule = [EXPERIMENT_WORKSPACE_ID, 'HEAD']

      const output = await dvcReader.plotsDiff(
        dvcDemoPath,
        ...revisionsRequiredForSubmodule
      )

      expect(output, 'should be an object').to.be.an('object')
      expect(isDvcError(output), 'should not be an error object').to.be.false
      const data = (output as PlotsOutput)?.data

      expect(Object.keys(data), 'should have 20 plot paths').to.have.lengthOf(
        20
      )

      // each set of plots under a path
      for (const plots of Object.values(data)) {
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

        const expectTemplate = (plot: TemplatePlotOutput) => {
          expect(
            plot?.anchor_definitions[PLOT_ANCHORS.DATA],
            'should have a data anchor definition'
          ).to.be.an('array')

          expect(plot.revisions, 'should have two revisions').to.have.lengthOf(
            2
          )

          const datapoints = plot?.anchor_definitions[PLOT_ANCHORS.DATA] || []
          const revisions = new Set()
          for (const datapoint of datapoints) {
            revisions.add(datapoint.rev)
            expect(
              datapoint,
              'should have an object of unknown type for each datapoint'
            ).to.be.an('object')
          }
          expect(
            [...revisions],
            'should have the HEAD and workspace revisions'
          ).to.have.lengthOf(2)
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

          if (isImagePlotOutput(plot)) {
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

      expect(output).deep.equal({ data: {} })
    })
  })
})
