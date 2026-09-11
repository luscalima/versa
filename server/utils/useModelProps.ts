type MaterializedGetters<T extends object> = Partial<{
  [K in keyof T]: T[K]
}>

type ChangeCaseType = 'snakeCase'

type Actions = {
  keysToCase?: ChangeCaseType
}

export function useModelProps<T extends object>(obj: T, actions?: Actions): MaterializedGetters<T> {
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

  if (actions?.keysToCase) {
    return keysToCase(result, actions.keysToCase) as MaterializedGetters<T>
  }

  return result
}

const changeCases: Record<ChangeCaseType, (str: string) => string> = {
  snakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  },
}

function keysToCase<T extends Record<string, unknown>>(
  result: MaterializedGetters<T>,
  changeCase: ChangeCaseType,
) {
  const obj = {} as MaterializedGetters<T>

  Object.keys(result).forEach(key => {
    const newKey = changeCases[changeCase](key)
    ;(obj as Record<PropertyKey, unknown>)[newKey] = result[key]
  })

  return obj
}
