export type Fetch = (
  url: RequestInfo | URL,
  options?: RequestInit,
) => Promise<Response>;

interface Options {
  baseUrl: string;
  cookie?: string;
}

interface FetchOptions extends RequestInit {
  // not part of the spec, we added query string convenience
  qs?: Record<string, string>;
}

export type CustomFetch = (
  url: string,
  options?: FetchOptions,
) => Promise<Response>;

const addQs = (url: string, qs?: Record<string, string>) =>
  qs
    ? (() => {
        const addPrefix = !/http(s?):\/\//.test(url);
        const theUrl = new URL(addPrefix ? `https://${url}` : url);
        // ugh... whatwg-fetch: https://github.com/github/fetch/issues/256
        Object.keys(qs).forEach(
          (key) => qs[key] && theUrl.searchParams.append(key, qs[key]),
        );
        return theUrl.href;
      })()
    : url;

/**
 * Creates a wrapper function around the HTML5 Fetch API that provides
 * default arguments to fetch(...) and is intended to reduce the amount
 * of boilerplate code in the application.
 * https://developer.mozilla.org/docs/Web/API/Fetch_API/Using_Fetch
 */
function createFetch(fetch: Fetch, { baseUrl, cookie }: Options): CustomFetch {
  const defaults: RequestInit = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  };

  const apiDefaults: RequestInit = {
    ...defaults,
    credentials: baseUrl ? 'include' : 'same-origin',
    headers: {
      ...defaults.headers,
      ...(cookie ? { Cookie: cookie } : null),
    },
    mode: baseUrl ? 'cors' : 'same-origin',
  };

  return async (url: string, passedOptions?: FetchOptions) => {
    const { headers, qs, ...options } = passedOptions || {};
    return (
      /^\/api/.test(url)
        ? fetch(addQs(`${baseUrl}${url}`, qs), {
            ...apiDefaults,
            ...options,
            headers: {
              ...apiDefaults.headers,
              ...headers,
            },
          })
        : fetch(addQs(url, qs), { ...options, headers })
    ).then(async (r: Response) => {
      if (!r.ok) {
        try {
          const body = await r.json();
          return await Promise.reject(
            new Error(`Fetch failed: ${body.message}`),
          );
        } catch {
          return Promise.reject(new Error('Fetch failed: unknown reason'));
        }
      }
      return r;
    });
  };
}

export default createFetch;
