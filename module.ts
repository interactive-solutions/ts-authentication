///<reference path='typings/angularjs/angular.d.ts'/>
///<reference path='typings/angular-ui-router/angular-ui-router.d.ts'/>
///<reference path='typings/is-stdlib/stdlib.d.ts'/>

module is.authentication {

  angular
    .module('is.authentication', [])

    // Services
    .service('authenticationService', AuthenticationService)
    .service('authenticationStorage', AuthenticationStorage)

    // Factories
    .factory('httpAuthorizationInjector', HttpAuthorizationInjector)
    .factory('httpRefreshTokenInjector', HttpRefreshTokenInjector)

    // Constants
    .constant('loginStateName', 'login')

    .config(function ($httpProvider:ng.IHttpProvider) {
      $httpProvider.interceptors.push('httpAuthorizationInjector');
      $httpProvider.interceptors.push('httpRefreshTokenInjector');
    });

}
