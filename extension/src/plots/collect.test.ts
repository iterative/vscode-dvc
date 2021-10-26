import { collectLivePlots } from './collect'
import complexExperimentsOutput from '../test/fixtures/complex-output-example'

describe('collectLivePlots', () => {
  it('should return the expected data from the test fixture', () => {
    const data = collectLivePlots(complexExperimentsOutput)
    expect(data.get('metrics:summary.json:loss')).toEqual([
      { group: 'exp-83425', x: 1, y: 1.9896177053451538 },
      { group: 'exp-83425', x: 2, y: 1.9329891204833984 },
      { group: 'exp-83425', x: 3, y: 1.8798457384109497 },
      { group: 'exp-83425', x: 4, y: 1.8261293172836304 },
      { group: 'exp-83425', x: 5, y: 1.775016188621521 },
      { group: 'test-branch', x: 1, y: 1.9882521629333496 },
      { group: 'test-branch', x: 2, y: 1.9293040037155151 },
      { group: 'exp-e7a67', x: 1, y: 2.020392894744873 },
      { group: 'exp-e7a67', x: 2, y: 2.0205044746398926 }
    ])
  })
})
