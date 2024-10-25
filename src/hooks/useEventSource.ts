import { EventSourcePolyfill } from 'event-source-polyfill';
import { useEffect, useState } from 'react';

const useEventSource = (
  url: string,
  clientId: string | null,
  initializeFn: (es: EventSourcePolyfill) => void,
) => {
  const [esConnected, setEsConnected] = useState(false);

  useEffect(() => {
    // Wait to get clientId from fetch
    // Otherwise, the ES might get a different client id
    if (!clientId) {
      return;
    }
    const es = new EventSourcePolyfill(url);

    es.addEventListener('open', () => {
      setEsConnected(true);
    });

    // fired by server when registration completed
    es.addEventListener('connected', () => {
      setEsConnected(true);
    });

    // fired by server just before closing
    es.addEventListener('connectionClosing', () => {
      setEsConnected(false);
    });

    es.addEventListener('error', (err) => {
      console.error('EventListener error', err);
      setEsConnected(false);
    });

    initializeFn(es);

    // cleanup
    return () => {
      try {
        es.close();
      } catch (err) {
        console.error(`Failed to close EventSource ${url}`, err);
      }
    };
  }, [clientId, initializeFn, url]);

  return esConnected;
};

export default useEventSource;
