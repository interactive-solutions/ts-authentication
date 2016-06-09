/**
 * @author    Antoine Hedgecock <antoine.hedgecock@gmail.com>
 *
 * @copyright Interactive Solutions AB
 */

import {AuthenticationStorage, AuthenticationService} from "./service";

interface IsRequestConfig extends ng.IRequestConfig {
  disableAuthorizationHeader?:boolean;
}

export function HttpAuthorizationInjector(authenticationStorage:AuthenticationStorage) {
  return {
    request: function (request:IsRequestConfig) {
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

export function HttpRefreshTokenInjector(loginStateName:string, $q:ng.IQService, $injector:any) {

  return {
    responseError: function (response:ng.IHttpPromiseCallbackArg<any>) {

      var httpService:ng.IHttpService = $injector.get('$http');
      var authService:AuthenticationService = $injector.get('authenticationService');
      var authStorage:AuthenticationStorage = $injector.get('authenticationStorage');
      var stateService:ng.ui.IStateService = $injector.get('$state');

      if (response.status === 401) {

        if (authStorage.hasAccessToken()) {

          return authService
            .refresh()
            .then(() => httpService(response.config))
            .catch(() => authStorage.clear());

        } else {
          stateService.go(loginStateName);
        }
      }

      return $q.reject(response);
    }
  };
}
