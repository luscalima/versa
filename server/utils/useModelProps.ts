type MaterializedGetters<T extends object> = Partial<{
  [K in keyof T]: T[K]
}>

export function useModelProps<T extends object>(obj: T): MaterializedGetters<T> {
  const result = {} as MaterializedGetters<T>

  let prototype: object | null = Object.getPrototypeOf(obj)

  while (prototype && prototype !== Object.prototype) {
    for (const key of Reflect.ownKeys(prototype)) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, key)

      if (descriptor?.get) {
        ;(result as Record<PropertyKey, unknown>)[key] = (obj as Record<PropertyKey, unknown>)[key]
      }
    }

    prototype = Object.getPrototypeOf(prototype)
  }

  return result
}
