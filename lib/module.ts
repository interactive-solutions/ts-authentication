module is.authentication
{
  angular
    .module('is.authentication', [])

    // directives
    .directive('authenticated', AuthenticatedToggleDirective)

    // Services
    .service('authenticationService', AuthenticationService)
    .service('authenticationStorage', AuthenticationStorage)

    // Factories
    .factory('httpAuthorizationInjector', HttpAuthorizationInjector)
    .factory('httpRefreshTokenInjector', HttpRefreshTokenInjector)

    // Constants
    .constant('loginStateName', 'login')

    .config(function ($httpProvider: ng.IHttpProvider) {
      $httpProvider.interceptors.push('httpAuthorizationInjector');
      $httpProvider.interceptors.push('httpRefreshTokenInjector');
    })
}
