/**
 * @author    Antoine Hedgecock <antoine.hedgecock@gmail.com>
 *
 * @copyright Interactive Solutions AB
 */

declare namespace InteractiveSolutions.Authentication {

  function HttpAuthorizationInjector(authenticationStorage: AuthenticationStorage): {
    request: (request: ng.IRequestConfig) => ng.IRequestConfig;
  };

  function HttpRefreshTokenInjector(loginStateName: string, $q: ng.IQService, $injector: any): {
    responseError: (response: ng.IHttpPromiseCallbackArg<any>) => ng.IPromise<void>;
  };

  /**
   * Simple data container for the access token
   */
  class AccessToken {
    constructor(accessToken: string, ownerId: any, expiresAt: number, refreshToken: string, tokenType: string);
    getAccessToken(): string;
    getOwnerId(): any;
    getExpiresAt(): number;
    getRefreshToken(): string;
    getTokenType(): string;
  }

  /**
   * Storage class, handles reading and writing to local storage.
   */
  class AuthenticationStorage {
    private accessToken;
    constructor();
    write(accessToken: AccessToken): void;
    read(): AccessToken;
    clear(): void;
    hasAccessToken(): boolean;
    private fromLocalStorage();
  }

  class AuthenticationService extends InteractiveSolutions.EventManager.EventManager {

    /**
     * @param $http
     * @param $rootScope
     * @param authenticationStorage
     */
    constructor($http: ng.IHttpService, $rootScope: ng.IRootScopeService, authenticationStorage: AuthenticationStorage);

    /**
     * Authenticate
     *
     * @param parameters
     *
     * @returns {IPromise<void>}
     */
    login(parameters: any): ng.IPromise<void>;

    /**
     * Use the refresh token to generate a new access token
     *
     * @returns {IPromise<void>}
     */
    refresh(): ng.IPromise<void>;

    /**
     * Check if the current user is authenticated, does not test if it's still valid tho.
     *
     * @returns {boolean}
     */
    isAuthenticated(): boolean;

    /**
     * Remove the oauth token and trigger a auth event
     */
    logout(): void;
  }

  class QueryString {

    /**
     * Convert a object to a query string
     *
     * @param obj
     */
    public static stringify(obj:any): string;

    /**
     * Parse the current window query string
     */
    public static parse(): string|boolean;
  }
}

