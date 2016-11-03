// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    var activation = Windows.ApplicationModel.Activation;
    var app = WinJS.Application;
    //var nav = WinJS.Navigation;
    //var sched = WinJS.Utilities.Scheduler;
    //var ui = WinJS.UI;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.

                WinJS.Application.onsettings = function (e) {

                    e.detail.applicationcommands = {

                        "privacy": { href: "privacypolicy.html", title: "Help & Privacy Policy" }

                    };

                    WinJS.UI.SettingsFlyout.populateSettings(e);

                }

                WinJS.Application.start();

            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }

            //nav.history = app.sessionState.history || {};
            //nav.history.current.initialPlaceholder = true;

            //ui.disableAnimations();
            //var p = ui.processAll().then(function () {
            //    return nav.navigate(nav.location || Application.navigator.home, nav.state);
            //}).then(function () {
            //    return sched.requestDrain(sched.Priority.aboveNormal + 1);
            //}).then(function () {
            //    ui.enableAnimations();
            //});

            //args.setPromise(p);

            args.setPromise(WinJS.UI.processAll().then(function () {

                document.getElementById("bt_offline").addEventListener('click', function (e) {
                    e.preventDefault();

                    $("#welcome").animate({ opacity: 0 }, 400, "linear", function () {
                        document.getElementById("game").style.display = "block";
                        tetris.show_home();
                    });

                });

                document.getElementById("bt_facebook").addEventListener('click', function (e) {
                    e.preventDefault();

                    fb.logIn(show_main_menu);

                });

                FixIt(document.getElementById('welcome'));
                FixIt(document.getElementById('page'));

                fb.player = localStorage['player'];
                if (fb.player) {
                    fb.player = JSON.parse(fb.player);
                    tetris.signIn();
                }
                else {
                    tetris.appBar.getCommandById("cmdSignOff").disabled = (fb.player == null);

                    $("#welcome").animate({ opacity: 1 }, 750);
                    document.getElementById("welcome").style.display = 'block';

                }

                tetris.updateBestScore();

            }));

        }

    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().

        if (tetris) {
            if (tetris.state == 'game' && !tetris.startingGame)
                tetris.pause_game();
        }
        //app.sessionState.history = nav.history;

    };

    app.start();
})();

function extractQuerystring(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i) {
        var p = a[i].split('=');
        if (p.length != 2) continue;
        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
};

function mute() {
    if (tetris)
        tetris.mute();
};

var CenterIt = function (el) {
    try {
        var winWidth = window.innerWidth;
        var winHeight = window.innerHeight;
        el.style.position = "absolute";
        el.style.left = ((winWidth / 2) - (el.clientWidth / 2)) + "px";
        el.style.top = ((winHeight / 2) - (el.clientHeight / 2)) + "px";
    } catch (ex) { }
};

function FixIt(el) {
    if (!el) {
        return;
    }
    var moveIt = function () {
        try {
            var winWidth = window.innerWidth;
            var winHeight = window.innerHeight;
            el.style.position = "absolute";
            el.style.left = ((winWidth / 2) - (el.clientWidth / 2)) + "px";
            el.style.top = ((winHeight / 2) - (el.clientHeight / 2)) + "px";
        } catch (ex) { }
    };

    window.addEventListener("resize", function () {
        moveIt();
        if (tetris)
            tetris.rePostionAds();
    });

    moveIt();

    window.setInterval(function () {
        moveIt();
    }, 1);
};

function show_main_menu() {

    $("#welcome").animate({ opacity: 0 }, 400, "linear", function () {
        document.getElementById("game").style.display = "block";
        tetris.show_home();
    });

};
