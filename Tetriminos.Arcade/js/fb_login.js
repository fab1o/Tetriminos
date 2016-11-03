var fb = {

    init: function () {

        window.FB = FBWinJS;

        var accessToken = localStorage.getItem('fb_access_token');

        FB.options({
            appId: '211400285735831',
            accessToken: accessToken
        });

    },

    player: null,

    isLoggedIn: function(){
        return fb.player != null;
    },

    logInFromLocalStorage: function(){

        fb.player = localStorage['player'];
        if (fb.player) {
            fb.player = JSON.parse(fb.player);

            if (callback)
                callback();
        }

    },

    logIn: function (callback) {
        
        if (fb.player) {
            if (callback)
                callback();
            return;
        }

        var redirectUri = 'https://www.facebook.com/connect/login_success.html';

        var loginUrl = FB.getLoginUrl({ scope: 'basic_info,publish_actions,user_friends' });

        window.onDialogOpen = true;

        Windows.Security.Authentication.Web.WebAuthenticationBroker.authenticateAsync(
            Windows.Security.Authentication.Web.WebAuthenticationBroker.default,
            new Windows.Foundation.Uri(loginUrl),
            new Windows.Foundation.Uri(redirectUri))
            .then(function success(result) {

                if (result.responseStatus == 2) {
                    var alertBox = (new Windows.UI.Popups.MessageDialog(result.responseerrordetail, "Facebook Authorization"));
                    alertBox.showAsync().done(function () {
                        window.onDialogOpen = false;
                    });
                    return;
                }

                if (result.responseData) {
                    var parser = document.createElement('a');
                    parser.href = result.responseData;

                    var qs = Helper.extractQuerystring(parser.hash.substr(1).split('&'));

                    if (!qs.access_token) {
                        var alertBox = (new Windows.UI.Popups.MessageDialog("You must authorize us to see your basic profile information such as your name.", "Facebook Authorization"));
                        alertBox.showAsync().done(function () {
                            window.onDialogOpen = false;
                        });
                        return;
                    } else {
                        window.onDialogOpen = false;
                    }

                    localStorage['fb_access_token'] = qs.access_token;
                    FB.setAccessToken(qs.access_token);

                    fb.getPlayerInfo(callback);

                }

            }, function error(err) {
                if (err.number != -2146697211) {
                    var alertBox = (new Windows.UI.Popups.MessageDialog(err.message, "Facebook Connection Error"));
                    alertBox.showAsync().done(function () {
                        window.onDialogOpen = false;
                    });
                }
            });

    },
    
    getPlayerInfo: function (callback) {

        var client = new Windows.Web.Http.HttpClient();

        try {

            client.getStringAsync(new Windows.Foundation.Uri("https://graph.facebook.com/me?access_token=" + FB.options('accessToken'))).done(function (result) {

                if (result) {
                    fb.player = JSON.parse(result);

                    localStorage['player'] = JSON.stringify(fb.player);

                    fb.getPlayerFriends(callback);
                }


            });

        } catch (ex) { }

    },

    getPlayerFriends: function (callback) {

        var client = new Windows.Web.Http.HttpClient();

        try {

            client.getStringAsync(new Windows.Foundation.Uri("https://graph.facebook.com/me/friends?access_token=" + FB.options('accessToken'))).done(function (result) {

                if (result) {
                    fb.player.friends = JSON.parse(result).data;

                    localStorage['player'] = JSON.stringify(fb.player);

                    if (callback)
                        callback();
                }


            });

        } catch (ex) { }

    },

    logOut: function (callback) {
        fb.player = null;
        localStorage.removeItem('player');
        localStorage.removeItem('fb_access_token');

        if (callback)
            callback();
    },


};

fb.init();