'use strict';

const got = require('got');
const { AuthorizationCode } = require('simple-oauth2');

module.exports = class nibeUplink {
    scope = 'READSYSTEM';
    data = {};

    get https_defaultoptions() { 
        return {
            host : 'api.nibeuplink.com', 
            protocol: 'https:',
            port : 443,
            method : 'GET',
            data: "",
            timeout: 3000,
            //json: true,
        };
    }
            
    constructor( clientId, clientSecret, callbackUrl, token ) {        
        this.callbackUrl = callbackUrl;

        this.oauthclient = new AuthorizationCode({
            client: {
                id: clientId,
                secret: clientSecret,
            },
            auth: { 
                tokenHost: 'https://api.nibeuplink.com',
                tokenPath: '/oauth/token',
                authorizePath: '/oauth/authorize', 
            },
            options: {
                authorizationMethod : "body"
            }
        });
        
        if ( typeof token != 'undefined' && token != null ) {
            // Token provided, so try to create using refresh token
            this.AccessToken = this.oauthclient.createToken(token);
        }

        //console.log(this.getSystems());
        
    }

    get accessToken() {
        return this.AccessToken;
    }

    get authorizeUrl() {
        // Authorization uri definition
        this.state = (Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 30));
        const authorizeUrl = this.oauthclient.authorizeURL({
            redirect_uri: this.callbackUrl,
            scope: this.scope,
            state: this.state,
        });
        return authorizeUrl;
    }    

    getAccessToken = async () => {
        if ( typeof this.AccessToken !== 'undefined' && this.AccessToken != null) {
            if ( this.AccessToken.expired() ) {         
                console.log('Token expired, try refresh.');
                try {
                    const refreshParams = { scope: this.scope };
                    this.AccessToken = await this.AccessToken.refresh(refreshParams);
                } catch (error) {
                    console.log('Error refreshing access token: ', error.message);
                }
            }
            return this.AccessToken.token.access_token;
        } else { return null; }
    }

    processCallback = async ( req ) => {
        const options = {
            code: req.query.code,
            redirect_uri: this.callbackUrl,
            scope: this.scope
        };

        try {
            this.AccessToken = await this.oauthclient.getToken(options);
            console.log('The resulting access token: ', this.AccessToken);
            return true;
        } catch (error) {
            this.AccessToken = null;
            console.error('Access Token Error', error.message);
            return false;            
        }        
    }

    doRequest = async ( options ) => {
        let access_token = await this.getAccessToken();
        let reqOptions = options;
        reqOptions.headers = { 
            Authorization: `Bearer ${access_token}`,
            Accept: "application/json, text/plain, */*"
        };
        //console.log('doRequest reqOptions: ',reqOptions);
        let response = await got(null, reqOptions);
        //console.log('doRequest response.body: ',response.body);
        return JSON.parse(response.body);
    }

    getData = async () => {
        return this.getParameters();
    }

    getSystems = async ( ) => {
        let options =  this.https_defaultoptions;
        options.pathname = 'api/v1/systems';
        let JSONresponse = await this.doRequest( options );
        //console.log('getSystems JSONresponse',JSONresponse);
        this.data.systems = JSONresponse.objects;
        //console.log('getSystems this.data.systems',this.data.systems);
        for ( var system in this.data.systems) {
            options.pathname = `api/v1/systems/${this.data.systems[system].systemId}/units`;
            JSONresponse = await this.doRequest( options );
            this.data.systems[system].units = JSONresponse;
        }
        console.log('getSystems this.data.systems=',JSON.stringify(this.data.systems, null, 2));        
        return this.data.systems;
    }

    getParameters = async ( ) => {
        let options =  this.https_defaultoptions;
        let JSONresponse = {};
        // Get Systems first. Without systems, no parameters
        if ( typeof this.data.systems === 'undefined' || this.data.systems === null) {
            await this.getSystems();
        }
        for ( var system in this.data.systems) {
            let systemId = this.data.systems[system].systemId;
            //let systemData = { systemId: systemId, systemUnitData : [] };
            for ( var unit in this.data.systems[system].units) {
                let systemUnitId = this.data.systems[system].units[unit].systemUnitId;
                options.pathname = `api/v1/systems/${systemId}/serviceinfo/categories`
                options.searchParams = { 
                    systemUnitId : systemUnitId,
                    parameters: true,
                }
                try {
                    JSONresponse = await this.doRequest( options );
                } catch (err) {
                    console.log( 'getParameters error: ', err );
                }
                //let unitData = { systemUnitId: systemUnitId, data: JSONresponse }                
                //systemData.systemUnitData.push(unitData);
                this.data.systems[system].units[unit].categories = JSONresponse;
            }            
        }
        //console.log('getParameters this.data=',JSON.stringify(this.data, null, 2));        
        return this.data;
    }

    

}
