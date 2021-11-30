export const createCustomWindow = () => {
  const customWindow = {
    addEventListener: jest.fn
  }
  Object.defineProperty(global, 'window', { value: customWindow })
}
