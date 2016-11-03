
function initializeLicense() {

    // Register for the license state change event.
    Windows.ApplicationModel.Store.CurrentApp.licenseInformation.addEventListener("licensechanged", reloadLicense);

    // other app initializations function

    displayTrialVersionExpirationTime();
};

function reloadLicense() {
    if (Windows.ApplicationModel.Store.CurrentApp.licenseInformation.isActive) {
        if (Windows.ApplicationModel.Store.CurrentApp.licenseInformation.isTrial) {

            if (!tetris.neverTrial) {
                document.getElementById('trialDiv').style.display = "block";
                tetris.trial = true;
            }
        }
        else {
            tetris.trial = false;
            document.getElementById('trialDiv').style.display = "none";
            document.getElementById('bt_new_game').innerHTML = "NEW GAME";
            document.getElementById('ad').style.display = "none";
            var ad = document.getElementById('ad').winControl;
            ad.suspend(true);
        }
    }
};

function displayTrialVersionExpirationTime() {

    if (tetris.neverTrial) {
        tetris.trial = false;
        document.getElementById('trialDiv').style.display = "none";
        document.getElementById('bt_new_game').innerHTML = "NEW GAME";
        document.getElementById('ad').style.display = "block";
        return -1;
    }

    //return 666;

    if (Windows.ApplicationModel.Store.CurrentApp.licenseInformation.isActive) {

        if (Windows.ApplicationModel.Store.CurrentApp.licenseInformation.isTrial) {

            var longDateFormat = Windows.Globalization.DateTimeFormatting.DateTimeFormatter("longdate");

            var daysRemaining = Math.round((Windows.ApplicationModel.Store.CurrentApp.licenseInformation.expirationDate - new Date()) / 86400000);

            //daysRemaining = 0;

            if (daysRemaining > 0)
                document.getElementById('trialDiv').innerHTML = "TRIAL <br/>" + daysRemaining + " DAY LEFT";
            else
                document.getElementById('trialDiv').innerHTML = "TRIAL <br/>EXPIRED";
            tetris.trial = true;

            document.getElementById('bt_new_game').innerText = "TRIAL MODE";

            document.getElementById('trialDiv').style.display = "block";

            return daysRemaining;
        }
        else {
            document.getElementById('trialDiv').style.display = "none";
            document.getElementById('bt_new_game').innerHTML = "NEW GAME";
            document.getElementById('ad').style.display = "none";
            //var ad = document.getElementById('ad').winControl;
            //ad.suspend(true);
            tetris.trial = false;
            return -1;
        }
    }
    else {
        document.getElementById('trialDiv').style.display = "none";
        document.getElementById('bt_new_game').innerHTML = "NEW GAME";
        tetris.trial = false;
        return -2;
    }
};