import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { Uri } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { restore } from 'sinon'
import { getRelativePattern } from '../../../fileSystem/watcher'
import { dvcDemoPath, getTestWorkspaceFolder } from '../../util'
import { joinWithForwardSlashes } from '../../../util/string'

suite('File System Watcher Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('getRelativePattern', () => {
    it('should return the expected relative pattern with a path inside of the workspace', () => {
      const relativePattern = getRelativePattern(
        join(dvcDemoPath, '.git'),
        '**'
      )
      expect(relativePattern.baseUri).to.deep.equal(
        getTestWorkspaceFolder().uri
      )
      expect(relativePattern.pattern).equal(
        joinWithForwardSlashes(['.git', '**'])
      )
    })

    it('should return the expected relative pattern for a path outside of the workspace', () => {
      const path = resolve(dvcDemoPath, '..', '.git')
      const relativePattern = getRelativePattern(path, '**')
      expect(relativePattern.baseUri.path).to.equal(Uri.file(path).path)
      expect(relativePattern.pattern).to.equal('**')
    })
  })
})
