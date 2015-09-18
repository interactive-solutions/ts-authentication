/**
 * @author    Antoine Hedgecock <antoine.hedgecock@gmail.com>
 *
 * @copyright Interactive Solutions AB
 */

module is.authentication {

  /**
   * Simple data container for the access token
   */
  export class AccessToken {
    constructor(private accessToken:string,
                private ownerId:any,
                private expiresAt:number,
                private refreshToken:string,
                private tokenType:string) {

    }

    getAccessToken():string {
      return this.accessToken;
    }

    getOwnerId():any {
      return this.ownerId;
    }

    getExpiresAt():number {
      return this.expiresAt;
    }

    getRefreshToken():string {
      return this.refreshToken;
    }

    getTokenType():string {
      return this.tokenType;
    }
  }

  /**
   * Storage class, handles reading and writing to local storage.
   */
  export class AuthenticationStorage {

    private accessToken:AccessToken = null;

    constructor() {
      this.fromLocalStorage();
    }

    private fromLocalStorage():void {
      var accessToken = localStorage.getItem('auth:accessToken');
      var ownerId = localStorage.getItem('auth:ownerId');
      var refreshToken = localStorage.getItem('auth:refreshToken');
      var expiresAt = localStorage.getItem('auth:expiresAt');
      var tokenType = localStorage.getItem('auth:tokenType');

      if (accessToken === null || refreshToken === null) {
        return;
      }

      this.accessToken = new AccessToken(accessToken, ownerId, expiresAt, refreshToken, tokenType);
    }

    public write(accessToken:AccessToken) {
      localStorage.setItem('auth:accessToken', accessToken.getAccessToken());
      localStorage.setItem('auth:ownerId', accessToken.getOwnerId());
      localStorage.setItem('auth:refreshToken', accessToken.getRefreshToken());
      localStorage.setItem('auth:expiresAt', accessToken.getExpiresAt().toString());
      localStorage.setItem('auth:tokenType', accessToken.getTokenType());

      this.accessToken = accessToken;
    }

    public read():AccessToken {
      return this.accessToken;
    }

    public clear():void {
      this.accessToken = null;

      localStorage.removeItem('auth:accessToken');
      localStorage.removeItem('auth:refreshToken');
      localStorage.removeItem('auth:ownerId');
      localStorage.removeItem('auth:expiresAt');
      localStorage.removeItem('auth:tokenType');
    }

    public hasAccessToken():boolean {
      return this.accessToken !== null;
    }
  }

  /**
   *
   */
  export class AuthenticationService {

    private http:ng.IHttpService;
    private storage:AuthenticationStorage;
    private rootScope:ng.IRootScopeService;

    /**
     * @param $http
     * @param $rootScope
     * @param authenticationStorage
     */
    constructor($http:ng.IHttpService, $rootScope: ng.IRootScopeService, authenticationStorage:AuthenticationStorage) {
      this.http = $http;
      this.rootScope = $rootScope;
      this.storage = authenticationStorage;
    }

    /**
     * Authenticate
     *
     * @param parameters
     *
     * @returns {IPromise<void>}
     */
    login(parameters:any):ng.IPromise<void> {

      var queryString = QueryString.stringify(parameters);

      return this.http({
        method: 'POST',
        url: '/oauth/token',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        data: queryString
      }).then((response:ng.IHttpPromiseCallbackArg<any>) => {

        // Time is returned in ms.
        var now = new Date().getTime() / 1000;

        var accessToken = new AccessToken(
          response.data.access_token,
          response.data.owner_id,
          response.data.expires_in + now,
          response.data.refresh_token,
          response.data.token_type
        );

        // Persist it
        this.storage.write(accessToken);

        // Trigger a auth event
        this.rootScope.$emit('authEvent', this);
      });
    }

    /**
     * Use the refresh token to generate a new access token
     *
     * @returns {IPromise<void>}
     */
    refresh():ng.IPromise<void> {

      var queryString = QueryString.stringify({
        grant_type: 'refresh_token',
        refresh_token: this.storage.read().getRefreshToken()
      });

      return this
        .http({
          method: 'POST',
          url: '/oauth/token',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          data: queryString
        })
        .then((response:ng.IHttpPromiseCallbackArg<any>) => {

          // Time is returned in ms.
          var now = new Date().getTime() / 1000;

          var accessToken = new AccessToken(
            response.data.access_token,
            response.data.owner_id,
            response.data.expires_in + now,
            response.data.refresh_token,
            response.data.token_type
          );

          // Persist it
          this.storage.write(accessToken);
        })
        .catch(() => this.storage.clear());
    }

    /**
     * Check if the current user is authenticated, does not test if it's still valid tho.
     *
     * @returns {boolean}
     */
    isAuthenticated():boolean {
      var now:number = new Date().getTime() / 1000;
      var token:AccessToken = this.storage.read();

      if (!token) {
        return false;
      }

      return token.getExpiresAt() >= now;
    }

    /**
     * Remove the oauth token and trigger a auth event
     */
    logout():void {

      // Delete the oauth token
      this.storage.clear();

      // Trigger a auth event
      this.rootScope.$emit('authEvent', this);
    }
  }
}
