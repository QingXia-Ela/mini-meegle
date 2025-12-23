type ExtractPromise<T> = T extends Promise<infer U> ? U : T;
