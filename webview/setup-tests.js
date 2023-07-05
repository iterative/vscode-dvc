// eslint-disable-next-line no-global-assign
window = {
  addEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}

const intersectionObserverMock = jest.fn().mockImplementation(() => {
  return {
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn()
  }
})
global.IntersectionObserver = intersectionObserverMock
