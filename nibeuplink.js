const { AuthorizationCode } = require('simple-oauth2');
import https from 'https';

class nibeUplink {
    scope = 'READSYSTEM';
    
    constructor( clientId, clientSecret, callbackUrl, token ) {        
        this.callbackUrl = callbackUrl;
        this.token = token;

        this.oauthclient = new AuthorizationCode({
            client: {
                id: clientId,
                secret: clientSecret,
            },
            auth: oauth2,
            options: {
                authorizationMethod : "body"
            }
        });
        
        getSystems();
        
    }

    get authorizeUrl() {
        // Authorization uri definition
        this.state = (Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 30));
        const authorizationUri = oauthclient.authorizeURL({
            redirect_uri: this.callbackUrl,
            scope: this.scope,
            state: this.state,
        });
    }    

    get accessToken() {
        if ( this.token ) {
            if ( this.token.expired() ) {         
                try {
                    const refreshParams = { scope: scope };
                    this.token = this.token.refresh(refreshParams);
                } catch (error) {
                    console.log('Error refreshing access token: ', error.message);
                }
            }
        } else { return null; }
    }

    processCallback = async ( req ) => {
        const options = {
            code: req.query.code,
            redirect_uri: callbackUrl,
            scope: this.scope
        };

        try {
            this.token = await oauthclient.getToken(options);
            console.log('The resulting token: ', accessToken.token);
            return true;
        } catch (error) {
            this.token = null;
            console.error('Access Token Error', error.message);
            return false;            
        }        
    }

    getSystems = async ( access_token ) => {
        let options =  https_defaultoptions;
        options.path = 'api/v1/systems';
        return await doRequest( options, access_token, cb );
    }

    doRequest = async ( options, access_token ) => {
        let reqOptions = options;
        reqOptions.headers = { Authorization: `Bearer ${access_token}` };
        var nibeRequest = await https.request(reqOptions, function(niberesult) {
            console.log("statusCode: ", niberesult.statusCode);
            console.log("headers: ", niberesult.headers);
                        
            niberesult.on('data', function(data) {
                if ( cb ) cb(data);    
            });
            
        });
        await nibeRequest.end();
    }
        

}
module.exports = nibeUplink;

const https_defaultoptions = {
    host : 'api.nibeuplink.com', 
    protocol: 'https:',
    port : 443,
    method : 'GET'
};

const oauth2 = { 
    tokenHost: 'https://api.nibeuplink.com',
    tokenPath: '/oauth/token',
    authorizePath: '/oauth/authorize', 
}




exports.g
}


function doRequest ( options, access_token, cb ) {
    let reqOptions = options;
    reqOptions.headers = { Authorization: `Bearer ${access_token}` };
    var nibeRequest = https.request(reqOptions, function(niberesult) {
        console.log("statusCode: ", niberesult.statusCode);
        console.log("headers: ", niberesult.headers);
                    
        niberesult.on('data', function(data) {
            cb(data);    
        });
        
    });
    nibeRequest.end();
}

