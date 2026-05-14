export type Effect<E, A> = TypedEffect<E, A>;
export type InferEffectError<T> = T extends TypedEffect<infer E, any> ? E : never;
export type InferEffectValue<T> = T extends TypedEffect<any, infer A> ? A : never;
export declare class TypedEffect<E, A> {
    private readonly executor;
    constructor(executor: () => Promise<A>);
    runPromise(): Promise<A>;
    map<B>(fn: (value: A) => B): TypedEffect<E, B>;
    flatMap<E2, B>(fn: (value: A) => TypedEffect<E2, B>): TypedEffect<E | E2, B>;
    tap<E2>(fn: (value: A) => TypedEffect<E2, unknown>): TypedEffect<E | E2, A>;
    mapError<E2>(fn: (error: E) => E2): TypedEffect<E2, A>;
    tapError<E2>(fn: (error: E) => TypedEffect<E2, unknown>): TypedEffect<E | E2, A>;
    catchAll<E2, B>(fn: (error: E) => TypedEffect<E2, B>): TypedEffect<E2, A | B>;
}
export declare const Effect: {
    succeed<A>(value: A): TypedEffect<never, A>;
    fail<E>(error: E): TypedEffect<E, never>;
    sync<E, A>(fn: () => A, onError?: (error: unknown) => E): TypedEffect<E | unknown, A>;
    tryPromise<E, A>(options: { try: () => Promise<A>; catch: (error: unknown) => E }): TypedEffect<E, A>;
    fromPromise<E, A>(promiseFactory: () => Promise<A>, onError?: (error: unknown) => E): TypedEffect<E | unknown, A>;
    map<E, A, B>(effect: TypedEffect<E, A>, fn: (value: A) => B): TypedEffect<E, B>;
    flatMap<E, E2, A, B>(effect: TypedEffect<E, A>, fn: (value: A) => TypedEffect<E2, B>): TypedEffect<E | E2, B>;
    tap<E, E2, A>(effect: TypedEffect<E, A>, fn: (value: A) => TypedEffect<E2, unknown>): TypedEffect<E | E2, A>;
    mapError<E, E2, A>(effect: TypedEffect<E, A>, fn: (error: E) => E2): TypedEffect<E2, A>;
    tapError<E, E2, A>(effect: TypedEffect<E, A>, fn: (error: E) => TypedEffect<E2, unknown>): TypedEffect<E | E2, A>;
    catchAll<E, E2, A, B>(effect: TypedEffect<E, A>, fn: (error: E) => TypedEffect<E2, B>): TypedEffect<E2, A | B>;
    runPromise<E, A>(effect: TypedEffect<E, A>): Promise<A>;
};
