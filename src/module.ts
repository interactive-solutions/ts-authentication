/**
 * @author Erik Norgren <erik.norgren@InteractiveSolutions.se>
 *
 * @copyright Interactive Solutions
 */

module InteractiveSolutions.Authentication {

  angular
    .module('interactivesolutions.authentication', [])

    // Services
    .service('authenticationService', AuthenticationService)
    .service('authenticationStorage', AuthenticationStorage)

    // Factories
    .factory('httpAuthorizationInjector', HttpAuthorizationInjector)
    .factory('httpRefreshTokenInjector', HttpRefreshTokenInjector)

    .config(function ($httpProvider:ng.IHttpProvider) {
      $httpProvider.interceptors.push('httpAuthorizationInjector');
      $httpProvider.interceptors.push('httpRefreshTokenInjector');
    });
}
