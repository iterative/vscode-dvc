// eslint-disable-next-line no-global-assign
window = {
  addEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}

for (const observer of ['IntersectionObserver', 'ResizeObserver']) {
  global[observer] = jest.fn().mockImplementation(() => {
    return {
      disconnect: jest.fn(),
      observe: jest.fn(),
      unobserve: jest.fn()
    }
  })
}
