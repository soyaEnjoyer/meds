type BaseDefinition = Record<string, number | bigint | boolean>;

class BaseEnum<Definition extends BaseDefinition> {
  /** type export workaround */
  get $key(): keyof Definition {
    return undefined as unknown as keyof Definition;
  }
  /** type export workaround */
  get $value(): Definition[keyof Definition] {
    return undefined as unknown as Definition[keyof Definition];
  }
  reversed: Readonly<Record<`${typeof this.$value}`, typeof this.$key>>;
  constructor(public readonly definition: Definition) {
    this.reversed = Object.fromEntries(Object.entries(definition).map(([key, val]) => [val, key]));
  }
  get entries(): [typeof this.$key, typeof this.$value][] {
    return Object.entries(this.definition) as [typeof this.$key, typeof this.$value][];
  }
  get keys(): (typeof this.$key)[] {
    return Object.keys(this.definition);
  }
  get values(): (typeof this.$value)[] {
    return Object.values(this.definition) as (typeof this.$value)[];
  }
  toValue(key: typeof this.$key): typeof this.$value {
    if (!(key in this.definition)) throw new Error(`invalid key ${key as string}`);
    return this.definition[key];
  }
  toKey(value: typeof this.$value): typeof this.$key {
    if (!(`${value}` in this.reversed)) throw new Error(`invalid value ${value}`);
    return this.reversed[`${value}`];
  }
}

// subclasss so all the type errors relating to the square bracket accessors are on two lines and can be ignored without breaking type safety of all functions and getters
export class Enum<Definition extends BaseDefinition> extends BaseEnum<Definition> {
  // square bracket accessor definition
  // @ts-expect-error
  [key: string]: typeof this.$value;
  // @ts-expect-error
  [value: number | bigint | boolean]: string;
  constructor(definition: Definition) {
    super(definition);
    // square bracket accessors
    for (const [key, value] of this.entries)
      Object.defineProperties(this, {
        [key]: {
          value,
          enumerable: true,
        },
        [`${value}`]: {
          value: key,
          enumerable: true,
        },
      });
  }
}
