import { Failure } from './failures';

export type Result<T> = { ok: true; data: T } | { ok: false; error: Failure };
