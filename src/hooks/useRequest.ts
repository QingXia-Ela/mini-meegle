import { useEffect, useRef, useState } from 'react';

const DEFAULT_CACHE_TIME = 60 * 1000;
const DEFAULT_TIMEOUT = 10000;

export default function useRequest<T extends any[] = any[], U = any>(
    api: (...args: T) => Promise<U>,
    options: {
        defaultValue?: U;
        retryCount?: number;
        cache?: boolean;
        timeout?: number;
        cancelLastRequestIfNextComing?: boolean;
        combiner?: (prev: U | undefined, next: U) => U;
        confirmError?: (response: U) => boolean;
    } = {}
) {
    const {
        defaultValue,
        retryCount,
        cache,
        timeout = DEFAULT_TIMEOUT,
        cancelLastRequestIfNextComing,
        combiner,
        confirmError,
    } = options;
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'pending' | 'ok' | 'error' | 'ready'>('ready');
    const [data, setData] = useState<U>(defaultValue as U);
    const [error, setError] = useState<any>(null);
    const [cacheStore, setCache] = useState<any>();

    const cancelTimer = useRef<any>(null);

    const request = (...args: T) => {
        if (loading) {
            return;
        }

        clearTimeout(cancelTimer.current);

        if (cache && cacheStore && cacheStore.time + DEFAULT_CACHE_TIME > Date.now()) {
            setData(cacheStore.data);
            setStatus('ok');
            return;
        }

        setStatus('pending');
        setError(null);
        setLoading(true);
        const req = api(...args)
            .then((res) => {
                if (confirmError?.(res)) throw res;
                const finalData = combiner ? combiner(data, res) : res;
                setData(finalData);
                setStatus('ok');
                if (cache) {
                    setCache({
                        time: Date.now(),
                        data: finalData,
                    });
                }
            })
            .catch((e) => {
                setError(e);
                setStatus('error');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const resetData = (resetVal?: U) => {
        setData(resetVal || (defaultValue as U));
        setStatus('ready');
        setError(null);
        setCache(null);
    };

    return {
        loading,
        status,
        data,
        error,
        request,
        resetData,
    };
}
