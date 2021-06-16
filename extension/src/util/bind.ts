export const bindMethods = <T>(self: T, ...methodNames: (keyof T)[]) =>
  methodNames.forEach(method => {
    if (typeof self[method] === 'function') {
      self[method] = ((self[method] as unknown) as Function).bind(self)
    }
  })
