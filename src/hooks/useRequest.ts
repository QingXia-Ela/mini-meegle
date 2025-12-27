import { useCallback, useRef, useState } from 'react';

const DEFAULT_CACHE_TIME = 60 * 1000;

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
        cache,
        combiner,
        confirmError,
        // 以下选项为预留功能，暂未实现
        // retryCount,
        // timeout = DEFAULT_TIMEOUT,
        // cancelLastRequestIfNextComing,
    } = options;
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'pending' | 'ok' | 'error' | 'ready'>('ready');
    const [data, setData] = useState<U>(defaultValue as U);
    const [error, setError] = useState<any>(null);

    // 使用 ref 存储缓存，避免不必要的重新渲染
    const cacheStoreRef = useRef<{ time: number; data: U } | null>(null);
    const cancelTimerRef = useRef<any>(null);
    // 使用 ref 存储当前数据，用于 combiner 函数
    const dataRef = useRef<U>(defaultValue as U);
    // 使用 ref 存储 loading 状态，避免在 useCallback 依赖中包含它
    const loadingRef = useRef(false);

    // 同步 ref 和 state
    dataRef.current = data;
    loadingRef.current = loading;

    // still doesn't work for cache, cannot add into useEffect dependencies
    const request = useCallback(
        (...args: T) => {
            if (loadingRef.current) {
                return;
            }

            clearTimeout(cancelTimerRef.current);

            // 检查缓存
            if (cache && cacheStoreRef.current) {
                const cacheData = cacheStoreRef.current;
                if (cacheData.time + DEFAULT_CACHE_TIME > Date.now()) {
                    setData(cacheData.data);
                    setStatus('ok');
                    return;
                }
            }

            setStatus('pending');
            setError(null);
            setLoading(true);
            loadingRef.current = true;

            api(...args)
                .then((res) => {
                    if (confirmError?.(res)) throw res;
                    // 使用 ref 获取最新的 data 值，避免闭包问题
                    const finalData = combiner
                        ? combiner(dataRef.current, res)
                        : res;
                    setData(finalData);
                    setStatus('ok');
                    if (cache) {
                        cacheStoreRef.current = {
                            time: Date.now(),
                            data: finalData,
                        };
                    }
                })
                .catch((e) => {
                    setError(e);
                    setStatus('error');
                })
                .finally(() => {
                    setLoading(false);
                    loadingRef.current = false;
                });
        },
        [api, cache, combiner, confirmError]
    );

    const resetData = useCallback(
        (resetVal?: U) => {
            const resetValue = resetVal || (defaultValue as U);
            setData(resetValue);
            dataRef.current = resetValue;
            setStatus('ready');
            setError(null);
            cacheStoreRef.current = null;
        },
        [defaultValue]
    );

    return {
        loading,
        status,
        data,
        error,
        request,
        resetData,
    };
}
