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

    constructor($http:ng.IHttpService, authenticationStorage:AuthenticationStorage) {
      this.http = $http;
      this.storage = authenticationStorage;
    }

    login(parameters:any):ng.IPromise<any> {

      var queryString = QueryString.stringify(parameters);

      return this.http({
        method: 'POST',
        url: '/oauth/token',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        data: queryString
      }).then(function (response:ng.IHttpPromiseCallbackArg<any>) {

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

      }.bind(this));
    }

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
        .then(function (response:ng.IHttpPromiseCallbackArg<any>) {

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

        }.bind(this))
        .catch(() => this.storage.clear());
    }

    isAuthenticated():boolean {
      var now:number = new Date().getTime() / 1000;
      var token:AccessToken = this.storage.read();

      if (!token) {
        return false;
      }

      return token.getExpiresAt() >= now;
    }

    logout():void {
      this.storage.clear();
    }
  }
}
