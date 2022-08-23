import { sep } from 'path'
import { describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { dvcDemoPath } from '../../util'
import { getCaseSensitiveCwd } from '../../../cli/dvc/cwd'

suite('Cwd Test Suite', () => {
  describe('getCaseSensitiveCwd', () => {
    it('should return a case sensitive path for case sensitive systems which matches os.getcwd() in the CLI', () => {
      const caseInsensitiveCwd = dvcDemoPath.toUpperCase()
      const realpathCwd = getCaseSensitiveCwd(caseInsensitiveCwd)

      expect(realpathCwd).to.have.length(dvcDemoPath.length)
      expect(realpathCwd).not.to.equal(
        ['win32', 'darwin'].includes(process.platform)
          ? caseInsensitiveCwd
          : caseInsensitiveCwd.toLowerCase(),
        'should behave differently on different systems'
      )

      const caseInsensitiveArray = caseInsensitiveCwd.split(sep)
      const realPathArray = realpathCwd.split(sep)

      expect(caseInsensitiveArray).to.have.length(realPathArray.length)
      for (let i = 0; i <= caseInsensitiveArray.length; i++) {
        expect(caseInsensitiveArray[i]).to.match(
          new RegExp(realPathArray[i], 'i')
        )
      }
    })
  })
})
