module is.authentication
{
    export function AuthenticatedToggleDirective(AuthenticationService: AuthenticationService)
    {
      return {
        restrict: 'A',
        link: (scope, element, attrs) => {

        }
      };
    }
}
