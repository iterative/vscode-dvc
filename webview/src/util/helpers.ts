export const cond: <T = void, F = void>(
  condition: boolean,
  ifTrue: () => T,
  ifFalse: () => F
) => T | F = (condition, ifTrue, ifFalse) => (condition ? ifTrue() : ifFalse())
