export class AppException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
export class ServerException extends AppException {}
export class CacheException extends AppException {}
export class NetworkException extends AppException {}
export class AuthException extends AppException {}
