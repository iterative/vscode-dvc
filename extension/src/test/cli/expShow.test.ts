/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub } from 'sinon'
import { getVenvBinPath } from '../../python'
import { dvcDemoPath } from '../util'
import { Config } from '../../config'
import { CliReader } from '../../cli/reader'

const config = {
  getCliPath: () => getVenvBinPath(__dirname, '.env', 'dvc')
} as Config

const cliReader = new CliReader(config, {
  processCompleted: { event: stub(), fire: stub() } as any,
  processStarted: { event: stub(), fire: stub() } as any
})

suite('exp show --show-json', () => {
  describe('Demo repo', () => {
    it('should do stuff', async () => {
      const output = await cliReader.experimentShow(dvcDemoPath)
      expect(output.workspace).not.to.be.undefined
    })
  })
})
