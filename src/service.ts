/**
 * @author    Antoine Hedgecock <antoine.hedgecock@gmail.com>
 *
 * @copyright Interactive Solutions AB
 */

module InteractiveSolutions.Authentication {

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

  export class AuthenticationStorage {

    private accessToken:AccessToken = null;

    constructor() {
      this.fromLocalStorage();
    }

    write(accessToken:AccessToken) {
      localStorage.setItem('auth:accessToken', accessToken.getAccessToken());
      localStorage.setItem('auth:ownerId', accessToken.getOwnerId());
      localStorage.setItem('auth:refreshToken', accessToken.getRefreshToken());
      localStorage.setItem('auth:expiresAt', accessToken.getExpiresAt().toString());
      localStorage.setItem('auth:tokenType', accessToken.getTokenType());

      this.accessToken = accessToken;
    }

    read():AccessToken {
      return this.accessToken;
    }

    clear():void {
      this.accessToken = null;

      localStorage.removeItem('auth:accessToken');
      localStorage.removeItem('auth:refreshToken');
      localStorage.removeItem('auth:ownerId');
      localStorage.removeItem('auth:expiresAt');
      localStorage.removeItem('auth:tokenType');
    }

    hasAccessToken():boolean {
      return this.accessToken !== null;
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
  }

  export class AuthenticationService extends InteractiveSolutions.EventManager.EventManager {

    private http:ng.IHttpService;
    private storage:AuthenticationStorage;

    private refreshPromise:ng.IPromise<void> = null;

    /**
     * @param $http
     * @param authenticationStorage
     */
    constructor($http:ng.IHttpService, authenticationStorage:AuthenticationStorage) {
      super();

      this.http = $http;
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
        this.emit('authentication-changed', this);
      });
    }

    /**
     * Use the refresh token to generate a new access token
     *
     * @returns {IPromise<void>}
     */
    refresh():ng.IPromise<void> {

      if (this.refreshPromise) {
        return this.refreshPromise;
      }

      var queryString = QueryString.stringify({
        grant_type: 'refresh_token',
        refresh_token: this.storage.read().getRefreshToken()
      });

      this.refreshPromise = this
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
        .catch(() => {
          this.storage.clear();
          this.emit('authentication-changed', this);
        })
        .finally(() => this.refreshPromise = null);

      return this.refreshPromise;
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
      this.emit('authentication-changed', this);
    }
  }
}
