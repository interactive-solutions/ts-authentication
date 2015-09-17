module is.authentication
{
  angular
    .module('is.authentication', [])

    // Services
    .service('authenticationService', AuthenticationService)
    .service('authenticationStorage', AuthenticationStorage)

    // Factories
    .factory('httpAuthorizationInjector', HttpAuthorizationInjector)
    .factory('httpRefreshTokenInjector', HttpRefreshTokenInjector)

    .config(function ($httpProvider: ng.IHttpProvider) {

      $httpProvider.interceptors.push('httpAuthorizationInjector');
      $httpProvider.interceptors.push('httpRefreshTokenInjector');
    })
}
