export const bindMethods = <T>(self: T, ...methodNames: string[]) =>
  methodNames.forEach(method => {
    if (typeof self[method as keyof T] === 'function') {
      self[method as keyof T] = ((self[
        method as keyof T
      ] as unknown) as Function).bind(self)
    }
  })
