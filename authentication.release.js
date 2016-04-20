var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var is;
(function (is) {
    var authentication;
    (function (authentication) {
        /* @ngInject */
        function HttpAuthorizationInjector(authenticationStorage) {
            return {
                request: function (request) {
                    if (request.url.indexOf('/oauth/token') !== -1) {
                        return request;
                    }
                    var token = authenticationStorage.read();
                    if (token && !request.disableAuthorizationHeader) {
                        request.headers['Authorization'] = 'Bearer ' + token.getAccessToken();
                    }
                    return request;
                }
            };
        }
        authentication.HttpAuthorizationInjector = HttpAuthorizationInjector;
        /* @ngInject */
        function HttpRefreshTokenInjector(loginStateName, $q, $injector) {
            return {
                responseError: function (response) {
                    var httpService = $injector.get('$http');
                    var authService = $injector.get('authenticationService');
                    var authStorage = $injector.get('authenticationStorage');
                    var stateService = $injector.get('$state');
                    if (response.status === 401) {
                        if (authStorage.hasAccessToken()) {
                            return authService
                                .refresh()
                                .then(function () { return httpService(response.config); })
                                .catch(function () { return authStorage.clear(); });
                        }
                        else {
                            stateService.go(loginStateName);
                        }
                    }
                    return $q.reject(response);
                }
            };
        }
        authentication.HttpRefreshTokenInjector = HttpRefreshTokenInjector;
    })(authentication = is.authentication || (is.authentication = {}));
})(is || (is = {}));
/**
 * @author    Antoine Hedgecock <antoine.hedgecock@gmail.com>
 *
 * @copyright Interactive Solutions AB
 */
var is;
(function (is) {
    var authentication;
    (function (authentication) {
        var QueryString = is.stdlib.QueryString;
        var EventManager = is.stdlib.EventManager;
        /**
         * Simple data container for the access token
         */
        var AccessToken = (function () {
            function AccessToken(accessToken, ownerId, expiresAt, refreshToken, tokenType) {
                this.accessToken = accessToken;
                this.ownerId = ownerId;
                this.expiresAt = expiresAt;
                this.refreshToken = refreshToken;
                this.tokenType = tokenType;
            }
            AccessToken.prototype.getAccessToken = function () {
                return this.accessToken;
            };
            AccessToken.prototype.getOwnerId = function () {
                return this.ownerId;
            };
            AccessToken.prototype.getExpiresAt = function () {
                return this.expiresAt;
            };
            AccessToken.prototype.getRefreshToken = function () {
                return this.refreshToken;
            };
            AccessToken.prototype.getTokenType = function () {
                return this.tokenType;
            };
            return AccessToken;
        }());
        authentication.AccessToken = AccessToken;
        /* @ngInject */
        var AuthenticationStorage = (function () {
            function AuthenticationStorage() {
                this.accessToken = null;
                this.fromLocalStorage();
            }
            AuthenticationStorage.prototype.write = function (accessToken) {
                localStorage.setItem('auth: accessToken', accessToken.getAccessToken());
                localStorage.setItem('auth: ownerId', accessToken.getOwnerId());
                localStorage.setItem('auth: refreshToken', accessToken.getRefreshToken());
                localStorage.setItem('auth: expiresAt', accessToken.getExpiresAt().toString());
                localStorage.setItem('auth: tokenType', accessToken.getTokenType());
                this.accessToken = accessToken;
            };
            AuthenticationStorage.prototype.read = function () {
                return this.accessToken;
            };
            AuthenticationStorage.prototype.clear = function () {
                this.accessToken = null;
                localStorage.removeItem('auth: accessToken');
                localStorage.removeItem('auth: refreshToken');
                localStorage.removeItem('auth: ownerId');
                localStorage.removeItem('auth: expiresAt');
                localStorage.removeItem('auth: tokenType');
            };
            AuthenticationStorage.prototype.hasAccessToken = function () {
                return this.accessToken !== null;
            };
            AuthenticationStorage.prototype.fromLocalStorage = function () {
                var accessToken = localStorage.getItem('auth: accessToken');
                var ownerId = localStorage.getItem('auth: ownerId');
                var refreshToken = localStorage.getItem('auth: refreshToken');
                var expiresAt = localStorage.getItem('auth: expiresAt');
                var tokenType = localStorage.getItem('auth: tokenType');
                if (accessToken === null || refreshToken === null) {
                    return;
                }
                this.accessToken = new AccessToken(accessToken, ownerId, expiresAt, refreshToken, tokenType);
            };
            return AuthenticationStorage;
        }());
        authentication.AuthenticationStorage = AuthenticationStorage;
        /* @ngInject */
        var AuthenticationService = (function (_super) {
            __extends(AuthenticationService, _super);
            /**
             * @param $http
             * @param authenticationStorage
             * @param $q
             */
            function AuthenticationService($http, authenticationStorage, $q) {
                _super.call(this);
                this.refreshPromise = null;
                this.http = $http;
                this.q = $q;
                this.storage = authenticationStorage;
            }
            /**
             * Authenticate
             *
             * @param parameters
             *
             * @returns {IPromise<void>}
             */
            AuthenticationService.prototype.login = function (parameters) {
                var _this = this;
                var queryString = QueryString.stringify(parameters);
                return this.http({
                    method: 'POST',
                    url: '/oauth/token',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: queryString
                }).then(function (response) {
                    // Time is returned in ms.
                    var now = new Date().getTime() / 1000;
                    var accessToken = new AccessToken(response.data.access_token, response.data.owner_id, response.data.expires_in + now, response.data.refresh_token, response.data.token_type);
                    // Persist it
                    _this.storage.write(accessToken);
                    // Trigger a auth event
                    _this.emit('authentication-changed', _this);
                });
            };
            /**
             * Use the refresh token to generate a new access token
             *
             * @returns {IPromise<void>}
             */
            AuthenticationService.prototype.refresh = function () {
                var _this = this;
                if (this.refreshPromise) {
                    return this.refreshPromise;
                }
                var queryString = QueryString.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: this.storage.read().getRefreshToken()
                });
                this.refreshPromise = this
                    .http({
                    method: 'POST',
                    url: '/oauth/token',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: queryString
                })
                    .then(function (response) {
                    // Time is returned in ms.
                    var now = new Date().getTime() / 1000;
                    var accessToken = new AccessToken(response.data.access_token, response.data.owner_id, response.data.expires_in + now, response.data.refresh_token, response.data.token_type);
                    // Persist it
                    _this.storage.write(accessToken);
                })
                    .catch(function () {
                    _this.storage.clear();
                    _this.emit('authentication-changed', _this);
                    return _this.q.reject();
                })
                    .finally(function () { return _this.refreshPromise = null; });
                return this.refreshPromise;
            };
            /**
             * Check if the current user is authenticated, does not test if it's still valid tho.
             *
             * @returns {boolean}
             */
            AuthenticationService.prototype.isAuthenticated = function () {
                var now = new Date().getTime() / 1000;
                var token = this.storage.read();
                if (!token) {
                    return false;
                }
                return token.getExpiresAt() >= now;
            };
            /**
             * Remove the oauth token and trigger a auth event
             */
            AuthenticationService.prototype.logout = function () {
                // Delete the oauth token
                this.storage.clear();
                // Trigger a auth event
                this.emit('authentication-changed', this);
            };
            return AuthenticationService;
        }(EventManager));
        authentication.AuthenticationService = AuthenticationService;
    })(authentication = is.authentication || (is.authentication = {}));
})(is || (is = {}));
/**
 * @author Erik Norgren <erik.norgren@interactivesolutions.se>
 * @copyright Interactive Solutions
 */
var is;
(function (is) {
    var authentication;
    (function (authentication) {
        angular
            .module('is.authentication', [])
            .service('authenticationService', authentication.AuthenticationService)
            .service('authenticationStorage', authentication.AuthenticationStorage)
            .factory('httpAuthorizationInjector', authentication.HttpAuthorizationInjector)
            .factory('httpRefreshTokenInjector', authentication.HttpRefreshTokenInjector)
            .config(function ($httpProvider) {
            $httpProvider.interceptors.push('httpAuthorizationInjector');
            $httpProvider.interceptors.push('httpRefreshTokenInjector');
        });
    })(authentication = is.authentication || (is.authentication = {}));
})(is || (is = {}));
