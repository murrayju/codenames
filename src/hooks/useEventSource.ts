import { useEffect, useState } from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';

const useEventSource = (
  url: string,
  initializeFn: (es: EventSourcePolyfill) => void,
) => {
  const [esConnected, setEsConnected] = useState(false);

  useEffect(() => {
    const es = new EventSourcePolyfill(url);

    es.addEventListener('open', () => {
      setEsConnected(true);
    }); // fired by server when registration completed

    es.addEventListener('connected', () => {
      setEsConnected(true);
    }); // fired by server just before closing

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
  }, [initializeFn, url]);

  return esConnected;
};

export default useEventSource;
