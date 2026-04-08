export type Failure =
  | { type: 'server'; message: string }
  | { type: 'cache'; message: string }
  | { type: 'network'; message: string }
  | { type: 'auth'; message: string }
  | { type: 'validation'; message: string }
  | { type: 'unexpected'; message: string };
