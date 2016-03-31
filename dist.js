/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @author Erik Norgren <erik.norgren@interactivesolutions.se>
	 *
	 * @copyright Interactive Solutions
	 */
	"use strict";
	var service_1 = __webpack_require__(1);
	var factory_1 = __webpack_require__(3);
	var interactivesolutions;
	(function (interactivesolutions) {
	    var authentication;
	    (function (authentication) {
	        angular
	            .module('interactivesolutions.authentication', [])
	            .service('authenticationService', service_1.AuthenticationService)
	            .service('authenticationStorage', service_1.AuthenticationStorage)
	            .factory('httpAuthorizationInjector', factory_1.HttpAuthorizationInjector)
	            .factory('httpRefreshTokenInjector', factory_1.HttpRefreshTokenInjector)
	            .config(function ($httpProvider) {
	            $httpProvider.interceptors.push('httpAuthorizationInjector');
	            $httpProvider.interceptors.push('httpRefreshTokenInjector');
	        });
	    })(authentication = interactivesolutions.authentication || (interactivesolutions.authentication = {}));
	})(interactivesolutions || (interactivesolutions = {}));


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @author    Antoine Hedgecock <antoine.hedgecock@gmail.com>
	 *
	 * @copyright Interactive Solutions AB
	 */
	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var utils_1 = __webpack_require__(2);
	var interactivesolutions_event_manager_1 = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"interactivesolutions-event-manager\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
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
	exports.AccessToken = AccessToken;
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
	exports.AuthenticationStorage = AuthenticationStorage;
	var AuthenticationService = (function (_super) {
	    __extends(AuthenticationService, _super);
	    /**
	     * @param $http
	     * @param authenticationStorage
	     */
	    function AuthenticationService($http, authenticationStorage) {
	        _super.call(this);
	        this.refreshPromise = null;
	        this.http = $http;
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
	        var queryString = utils_1.QueryString.stringify(parameters);
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
	        var queryString = utils_1.QueryString.stringify({
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
	}(interactivesolutions_event_manager_1.EventManager));
	exports.AuthenticationService = AuthenticationService;


/***/ },
/* 2 */
/***/ function(module, exports) {

	/**
	 * @author Erik Norgren <erik.norgren@interactivesolutions.se>
	 *
	 * @copyright Interactive Solutions
	 */
	"use strict";
	/**
	 * Utility query string class
	 */
	var QueryString = (function () {
	    function QueryString() {
	    }
	    /**
	     * Creates a query string from an object
	     *
	     * @param obj
	     * @returns {string}
	     */
	    QueryString.stringify = function (obj) {
	        var queryString = obj ? Object.keys(obj).sort().map(function (key) {
	            var val = obj[key];
	            if (val === '' || val === undefined) {
	                return;
	            }
	            if (Array.isArray(val)) {
	                return val.sort().map(function (val2) {
	                    return encodeURIComponent(key) + '=' + encodeURIComponent(val2);
	                }).join('&');
	            }
	            return encodeURIComponent(key) + '=' + encodeURIComponent(val);
	        }).join('&') : '';
	        var regExp = new RegExp('&+');
	        queryString = queryString.replace(regExp, '&');
	        if (queryString.charAt(0) === '&') {
	            queryString = queryString.substr(1);
	        }
	        return queryString;
	    };
	    QueryString.parse = function () {
	        var queryString = {};
	        var href = window.location.href;
	        var query = href.split('?')[1];
	        if (!query) {
	            return false;
	        }
	        var vars = query.split('&');
	        for (var i = 0; i < vars.length; i++) {
	            var pair = vars[i].split('=');
	            if (typeof queryString[pair[0]] === 'undefined') {
	                queryString[pair[0]] = decodeURIComponent(pair[1]);
	            }
	            else if (typeof queryString[pair[0]] === 'string') {
	                queryString[pair[0]] = [queryString[pair[0]], decodeURIComponent(pair[1])];
	            }
	            else {
	                queryString[pair[0]].push(decodeURIComponent(pair[1]));
	            }
	        }
	        return queryString;
	    };
	    return QueryString;
	}());
	exports.QueryString = QueryString;


/***/ },
/* 3 */
/***/ function(module, exports) {

	/**
	 * @author    Antoine Hedgecock <antoine.hedgecock@gmail.com>
	 *
	 * @copyright Interactive Solutions AB
	 */
	"use strict";
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
	exports.HttpAuthorizationInjector = HttpAuthorizationInjector;
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
	exports.HttpRefreshTokenInjector = HttpRefreshTokenInjector;


/***/ }
/******/ ]);
//# sourceMappingURL=dist.js.map