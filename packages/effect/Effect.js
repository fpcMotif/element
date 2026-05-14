class TypedEffect {
    constructor(executor) {
        this.executor = executor;
    }
    runPromise() {
        return this.executor();
    }
    map(fn) {
        return map(this, fn);
    }
    flatMap(fn) {
        return flatMap(this, fn);
    }
    tap(fn) {
        return tap(this, fn);
    }
    mapError(fn) {
        return mapError(this, fn);
    }
    tapError(fn) {
        return tapError(this, fn);
    }
    catchAll(fn) {
        return catchAll(this, fn);
    }
}
const succeed = (value) => new TypedEffect(() => Promise.resolve(value));
const fail = (error) => new TypedEffect(() => Promise.reject(error));
const sync = (fn, onError) => new TypedEffect(() => {
    try {
        return Promise.resolve(fn());
    } catch (error) {
        return Promise.reject(onError ? onError(error) : error);
    }
});
const tryPromise = (options) => new TypedEffect(() => options.try().catch((error) => Promise.reject(options.catch(error))));
const fromPromise = (promiseFactory, onError) => new TypedEffect(() => promiseFactory().catch((error) => Promise.reject(onError ? onError(error) : error)));
const map = (effect, fn) => new TypedEffect(() => effect.runPromise().then(fn));
const flatMap = (effect, fn) => new TypedEffect(() => effect.runPromise().then((value) => fn(value).runPromise()));
const tap = (effect, fn) => new TypedEffect(async () => {
    const value = await effect.runPromise();
    await fn(value).runPromise();
    return value;
});
const mapError = (effect, fn) => new TypedEffect(() => effect.runPromise().catch((error) => Promise.reject(fn(error))));
const tapError = (effect, fn) => new TypedEffect(() => effect.runPromise().catch(async (error) => {
    await fn(error).runPromise();
    throw error;
}));
const catchAll = (effect, fn) => new TypedEffect(() => effect.runPromise().catch((error) => fn(error).runPromise()));
const runPromise = (effect) => effect.runPromise();
const Effect = {
    succeed,
    fail,
    sync,
    tryPromise,
    fromPromise,
    map,
    flatMap,
    tap,
    mapError,
    tapError,
    catchAll,
    runPromise,
};
module.exports = { TypedEffect, Effect };
