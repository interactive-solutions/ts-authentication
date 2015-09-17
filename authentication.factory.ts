module is.authentication
{
  export function HttpAuthorizationInjector(authenticationStorage: AuthenticationStorage)
  {
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
    }
  }

  export function HttpRefreshTokenInjector($q: ng.IQService, $injector: any) {

    return {
      responseError: function (response: ng.IHttpPromiseCallbackArg<any>) {

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

            // TODO: SHOULD REALLY BE START-PAGE

            // No access token, well fuck you, go login.
            stateService.go('auth.password');
          }
        }

        return $q.reject(response);
      }
    }
  }
}
