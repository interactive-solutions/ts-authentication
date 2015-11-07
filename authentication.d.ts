/// <reference path="typings/angularjs/angular.d.ts" />
/// <reference path="typings/angular-ui-router/angular-ui-router.d.ts" />
/// <reference path="typings/is-stdlib/stdlib.d.ts" />
declare module is.authentication {
    function HttpAuthorizationInjector(authenticationStorage: AuthenticationStorage): {
        request: (request: ng.IRequestConfig) => ng.IRequestConfig;
    };
    function HttpRefreshTokenInjector(loginStateName: string, $q: ng.IQService, $injector: any): {
        responseError: (response: ng.IHttpPromiseCallbackArg<any>) => ng.IPromise<void>;
    };
}
declare module is.authentication {
}
/**
 * @author    Antoine Hedgecock <antoine.hedgecock@gmail.com>
 *
 * @copyright Interactive Solutions AB
 */
declare module is.authentication {
    /**
     * Simple data container for the access token
     */
    class AccessToken {
        private accessToken;
        private ownerId;
        private expiresAt;
        private refreshToken;
        private tokenType;
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
    /**
     *
     */
    class AuthenticationService {
        private http;
        private storage;
        private rootScope;
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
}
