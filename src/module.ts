/**
 * @author Erik Norgren <erik.norgren@interactivesolutions.se>
 *     
 * @copyright Interactive Solutions
 */

import {AuthenticationService, AuthenticationStorage} from "./service";
import {HttpAuthorizationInjector, HttpRefreshTokenInjector} from "./factory";

module interactivesolutions.authentication
{
  angular
    .module('interactivesolutions.authentication', [])

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
