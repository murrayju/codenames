export async function findAsync<T, R>(
  array: T[],
  predicate: (element: T, index: number, array: T[]) => Promise<R>,
  thisArg?: Object,
): Promise<[T, R] | void> {
  if (array == null) {
    throw new TypeError('Array is null or undefined');
  }
  if (typeof predicate !== 'function') {
    throw new TypeError('Predicate must be a function');
  }

  const len = array.length || 0;
  let i = 0;

  while (i < len) {
    const val = array[i]; // eslint-disable-next-line no-await-in-loop
    const result = await predicate.call(thisArg, val, i, array);
    if (result) {
      return [val, result];
    }
    i += 1;
  }
  return undefined;
}

export function allowDenyFilter<T, L>(
  list: T[],
  allow?: null | L[],
  deny?: null | L[],
  lookup: (item: T) => L = (item) => item as unknown as L,
): T[] {
  return list.filter((item) => {
    const l = lookup(item);
    return (!allow || allow.includes(l)) && (!deny || !deny.includes(l));
  });
}
