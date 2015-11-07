module is.authentication {

  export function HttpAuthorizationInjector(authenticationStorage: AuthenticationStorage) {
  return {
    request: function (request: ng.IRequestConfig) {

      if (request.url.indexOf('/oauth/token') !== -1) {
        return request;
      }

      var token = authenticationStorage.read();
      if (token) {
        request.headers['Authorization'] = 'Bearer ' + token.getAccessToken();
      }

      return request;
    }
  };
}

  export function HttpRefreshTokenInjector(loginStateName: string, $q: ng.IQService, $injector: any) {

    return {
      responseError: function (response: ng.IHttpPromiseCallbackArg<any>) {

        var httpService: ng.IHttpService = $injector('$http');
        var authService: AuthenticationService = $injector('authenticationService');
        var authStorage: AuthenticationStorage = $injector('authenticationStorage');
        var stateService: ng.ui.IStateService = $injector('$state');

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
}