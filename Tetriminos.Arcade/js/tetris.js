function Challenges() {

    var self = this;

    this.hover = null;

    this.current = null;
    //this.currentIndex = null;

    this.arr = new Array();

    this.first = function () {
        return self.arr[0];
    };
    this.last = function () {
        return self.arr[self.arr.length - 1];
    };
    this.add = function (challenge) {
        self.arr.push(challenge);
    };
    this.get = function (index) {
        return self.arr[index];
    };
    this.count = function () {
        return self.arr.length;
    };
    this.countDone = function () {
        var qty = 0;
        for (var i = 0; i < self.arr.length; i++) {
            if (self.arr[i].done) {
                qty++;
            }
        }
        return qty;
    };

    this.lastDone = function () {
        var challengeAux = null;
        for (i = 0; i < self.arr.length; i++) {
            if (self.arr[i].done) {
                challengeAux = self.arr[i];
            } else {
                break;
            }
        }
        return challengeAux;
    }
};

function Challenge() {
    var self = this;

    this.id = 0;
    this.div = null;
    this.starDiv = null;
    this.text = "";
    this.textDiv = null;
    this.hintSpan = null;
    this.starSpan = null;
    this.hintText = "";
    this.color = "";
    this.prev = null;
    this.next = null;
    this.ellapsedSeconds = 0;
    this.score = 0;

    this.clause = null;

    this.tried = false; //let players skip challenge
    this.done = false;
    this.activated = false;

    this.stars = 0;

    this.getStarText = function (stars) {

        if (stars == 3)
            return "★★★";
        else if (stars == 2)
            return "★★☆";
        else if (stars == 1)
            return "★☆☆";
        else
            return "☆☆☆";

    }
    this.star = function (stars) {

        self.starSpan.innerHTML = self.getStarText(stars);

        self.stars = stars;

        self.done = stars > 0;
    };

    this.activate = function () {

        tetris.challenge_text.innerHTML = self.text;

        if (self.activated)
            return;

        self.activated = true;

        Helper.removeClass(self.div, 'notdone');
        Helper.removeClass(self.starDiv, 'star');
        Helper.addClass(self.starDiv, 'starred');
        Helper.addClass(self.div, self.color);

        Helper.addClass(self.div, self.color + "_pulse");

        Helper.addClass(self.div, "outline-inward");
        Helper.addClass(self.div, "challenge_active");

        //self.div.addEventListener("pointerover", function (e) {
        //    e.preventDefault();
        //    e.stopPropagation();
        //    if (tetris.challenges.hover != self) {
        //        tetris.challenges.hover = self;
        //        if (!tetris.mutedFx)
        //            document.getElementById('button_select').play();
        //    }
        //});

        self.div.addEventListener("pointerdown", function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (tetris.challenges.current != null && self.id == tetris.challenges.current.id) { //ask before

                var alertBox = (new Windows.UI.Popups.MessageDialog("Would you like to restart this challenge or resume?", "Challenges"));

                alertBox.commands.append(new Windows.UI.Popups.UICommand("Restart", null, 1));
                alertBox.commands.append(new Windows.UI.Popups.UICommand("Resume", null, 2));

                alertBox.defaultCommandIndex = 0;
                alertBox.cancelCommandIndex = 1;

                return alertBox.showAsync().then(function (command) {
                    if (command) {
                        if (command.id == 1) {
                            tetris.init_game(self);
                        }
                        else if (command.id == 2) {
                            tetris.resumeorNewGame();
                        }
                    }
                });


            } else {
                tetris.init_game(self);
            }

        });

    };

    this.do = function () {
        if (self.prev && !self.prev.done)
            return;

        var stars = self.clause(self);

        if (stars == 1) {
            self.next.activate();
        }

        if (stars > self.stars) {

            tetris.challengeMessage("CHALLENGE DONE " + self.getStarText(stars), self.color);
            localStorage["challenge_stars_" + self.id] = stars;
            self.hintSpan.innerHTML = self.score + " points in " + Helper.ellapsedTimeText(self.ellapsedSeconds);
            self.star(stars);

            if (self.next) {
                tetris.challenges.current = self.next;
                tetris.challenge_text.innerHTML = tetris.challenges.current.text;
            }
            tetris.resetChallengePoints();

        }

    };

};

var tetris = {

    name: "Tetriminos Arcade",

    SINGLE: 40,

    DOUBLE: 100,

    TRIPLE: 300,

    TETRIMINOS: 1200,

    // html elements
    page: null,
    page_home: null,
    page_game: null,
    page_challenges: null,
    game_col: null,
    game_zone: null,
    messages: null,
    overlay: null,
    infos: null,
    next_zone: null,
    best_zone: null,
    score_zone: null,
    level_zone: null,
    lines_zone: null,
    blocks_zone: null,
    timer_zone: null,
    challenge_text: null,

    bt_new_game: null,
    bt_challenges: null,
    bt_facebook_sign: null,

    download_div: null,

    gestureObject: new MSGesture(),

    container: null,

    appBar: null,

    qtySoundTracks: 7,

    startingGame: false,
    audios: [],
    currentAudio: null,
    currentAudioIndex: 0,
    muted: false,
    mutedFx: false,

    calledPause: false,
    forcedPause: false,

    holding: false,

    // display (kinetic)
    stage: null,
    next_stage: null,
    layer_stone: null,
    layer_shadow: null,
    layer_block: null,
    next_layer: null,

    block_width: 0,
    block_height: 0,
    block_width_standard: .07,
    display_stone: [],
    display_shadow: [],
    display_block: [],
    display_line: [],
    display_next: [],
    shine_tab: [],

    // game infos
    state: null,
    board: [],
    next_block: null,
    next_block_pos: null,
    block: null,
    block_pos: null,
    block_x: 0,
    block_y: 0,
    rows: 20,
    cols: 10,

    //trial: false,
    //neverTrial: false,

    secondsToStartGame: 2, //seconds

    // speed
    fall_timeout: null,
    stationary: false,

    init_speed: 600,

    max_speed_mode: false,
    max_speed: 50,
    speed: 0,

    // counters
    level: 0,
    score: 0,
    challenge_score: 0,

    challenge_levelJumps: 0,
    challenge_count_single: 0,
    challenge_count_double: 0,
    challenge_count_triple: 0,
    challenge_count_tetris: 0,
    challenge_lines: 0,

    count_tetris: 0,

    best_score_tetris: 0,
    best_score_player: 0,
    lines: 0,
    count_noclear: 0,//saves number of blocks dropped that wont clear lines
    count_blocks: 0,

    count_blocks_sequence: 0,
    count_noclear_sequence: 0, //saves last number of blocks dropped in sequence that wont clear lines

    last_count_blocks_sequence: 0,
    last_count_noclear_sequence: 0,//saves last number of blocks dropped in sequence

    count_single: 0,
    count_double: 0,
    count_triple: 0,
    count_tetris: 0,

    challenge_count_drops: 0,
    challenge_floor_hits: 0,

    floor_hits: 0,
    count_drops: null,

    // touch/finger controls
    last_pos_x: 0,
    last_pos_y: 0,
    moving: false,
    time_touch_down: 0,
    double_tap_time: 0,
    finger_lock: false,

    // keyboard controls
    press_left: false,
    press_right: false,
    press_down: false,
    press_drop: false,
    press_rotate: false,

    mappings: {
        '32': 'drop',   // 32 = Space
        '37': 'left',   // 37 = Left
        '38': 'rotate', // 38 = Up
        '39': 'right',  // 39 = Right
        '40': 'down'   // 40 = Down
    },
    colors: [
      '#00E4E4',  // line piece
      '#E4DE00',  // square piece
      '#004EE4',  // J piece
      '#E46200',  // L piece
      '#00E427',  // S piece
      '#E40027',  // Z piece
      '#9C13E4'   // T piece
    ],

    tab_probability: [1, 1, 1, 1, 1, 1, 1],

    challenges: new Challenges(),
    challenge_mode: false,

    shape: [
      // line piece
      [
        [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0]
        ],
        [
          [0, 1, 0, 0],
          [0, 1, 0, 0],
          [0, 1, 0, 0],
          [0, 1, 0, 0]
        ],
        [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0]
        ],
        [
          [0, 0, 1, 0],
          [0, 0, 1, 0],
          [0, 0, 1, 0],
          [0, 0, 1, 0]
        ]
      ],
      // square piece
      [
        [
          [1, 1],
          [1, 1]
        ]
      ],
      // J piece
      [
        [
          [0, 0, 0],
          [1, 1, 1],
          [0, 0, 1]
        ],
        [
          [0, 1, 0],
          [0, 1, 0],
          [1, 1, 0]
        ],
        [
          [1, 0, 0],
          [1, 1, 1],
          [0, 0, 0]
        ],
        [
          [0, 1, 1],
          [0, 1, 0],
          [0, 1, 0]
        ]
      ],
      // L piece
      [
        [
          [0, 0, 0],
          [1, 1, 1],
          [1, 0, 0]
        ],
        [
          [1, 1, 0],
          [0, 1, 0],
          [0, 1, 0]
        ],
        [
          [0, 0, 1],
          [1, 1, 1],
          [0, 0, 0]
        ],
        [
          [0, 1, 0],
          [0, 1, 0],
          [0, 1, 1]
        ]
      ],
      // S piece
      [
        [
          [0, 0, 0],
          [0, 1, 1],
          [1, 1, 0]
        ],
        [
          [1, 0, 0],
          [1, 1, 0],
          [0, 1, 0]
        ],
        [
          [0, 1, 1],
          [1, 1, 0],
          [0, 0, 0]
        ],
        [
          [0, 1, 0],
          [0, 1, 1],
          [0, 0, 1]
        ]
      ],
      // Z piece
      [
        [
          [0, 0, 0],
          [1, 1, 0],
          [0, 1, 1]
        ],
        [
          [0, 1, 0],
          [1, 1, 0],
          [1, 0, 0]
        ],
        [
          [1, 1, 0],
          [0, 1, 1],
          [0, 0, 0]
        ],
        [
          [0, 0, 1],
          [0, 1, 1],
          [0, 1, 0]
        ]
      ],
      // T piece
      [
        [
          [0, 0, 0],
          [1, 1, 1],
          [0, 1, 0]
        ],
        [
          [0, 1, 0],
          [1, 1, 0],
          [0, 1, 0]
        ],
        [
          [0, 1, 0],
          [1, 1, 1],
          [0, 0, 0]
        ],
        [
          [0, 1, 0],
          [0, 1, 1],
          [0, 1, 0]
        ]
      ]
    ],

    resetChallengePoints: function () {
        tetris.last_count_noclear_sequence = 0;
        tetris.challenge_count_single = 0;
        tetris.challenge_count_double = 0;
        tetris.challenge_count_triple = 0;
        tetris.challenge_count_tetris = 0;
        tetris.challenge_score = 0;
        tetris.challenge_lines = 0;
        tetris.ellapsedSeconds = 0;
        tetris.challenge_floor_hits = 0;
        tetris.challenge_count_drops = 0;
        tetris.challenge_levelJumps = 0;
        tetris.restartedAt = new Date();
    },

    startedAt: null,
    restartedAt: null,
    endedAt: null,
    ellapsedSeconds: 0,

    timerInterval: null,

    startTimer: function () {
        tetris.ellapsedSeconds = 0;
        tetris.startedAt = new Date();
        tetris.restartedAt = new Date();
        tetris.endedAt = null;

        if (tetris.challenge_mode) {
            tetris.timer_zone.innerHTML = Helper.ellapsedTimeText(tetris.getEllapsedTime());
            tetris.timerInterval = setInterval(function () {
                tetris.timer_zone.innerHTML = Helper.ellapsedTimeText(tetris.getEllapsedTime());
            }, 1000);
        }

    },
    endTimer: function () {
        tetris.endedAt = new Date();
        tetris.ellapsedSeconds = tetris.getEllapsedTime();

        if (tetris.challenge_mode)
            tetris.timer_zone.innerHTML = Helper.ellapsedTimeText(tetris.ellapsedSeconds);

        if (tetris.timerInterval)
            clearInterval(tetris.timerInterval);
    },
    pauseTimer: function () {
        var seconds = tetris.getEllapsedTime();

        if (!isNaN(seconds))
            tetris.ellapsedSeconds = seconds + 1;

        //if (tetris.challenge_mode)
        //tetris.timer_zone.innerHTML = Helper.ellapsedTimeText(tetris.ellapsedSeconds);

        tetris.restartedAt = null;
        if (tetris.timerInterval)
            clearInterval(tetris.timerInterval);
    },
    resumeTimer: function () {
        tetris.restartedAt = new Date();
        //tetris.restartedAt.setSeconds(tetris.restartedAt.getSeconds() + 1); //this doesnt work

        if (tetris.challenge_mode) {
            tetris.timer_zone.innerHTML = Helper.ellapsedTimeText(tetris.getEllapsedTime());
            tetris.timerInterval = setInterval(function () {
                tetris.timer_zone.innerHTML = Helper.ellapsedTimeText(tetris.getEllapsedTime());
            }, 1000);
        }
    },
    getEllapsedTime: function () {
        if (tetris.restartedAt) {
            var now = new Date();
            return tetris.ellapsedSeconds + Math.floor((now - tetris.restartedAt) / 1000);
        } else {
            return 0;
        }
    },

    getAccumulatedCountDrops: function (level) {

        var counter = 0;

        for (var i = level; i <= tetris.level; i++) {
            counter += tetris.count_drops[i];
        }

        return counter;
    },

    last_color_challenge: "",

    alternateColorChallenge: function (level, type) {

        var color;

        switch (tetris.last_color_challenge) {
            case "lightblue":
                color = "green";
                break;
            case "green":
                color = "purple";
                break;
            case "purple":
                color = "orange";
                break;
            case "orange":
                color = "red";
                break;
            default:
                color = "lightblue";
        }

        tetris.last_color_challenge = color;

        return color;

    },

    //function called when player has completed challenge and game needs to star it
    // threshold is maximum seconds, if player took more time than this, he deserves 1 star (this should be an average of all players in the future)
    // effort is between 1 and 9 (1 is hard, 9 is easy)
    //starChallengeBasedOnTime: function (challenge, stars3, stars2) {
    //    //if (typeof seconds == "undefined" || seconds == null){
    //    //    seconds = tetris.getEllapsedTime();
    //    //}
    //    var timeSpent = tetris.getEllapsedTime();

    //    if (isNaN(timeSpent))
    //        return challenge.stars;

    //    //if (secondsTaken > threshold)
    //    //    return 1;

    //    if (challenge.ellapsedSeconds > 0) { //check if player already have challenged this, if yes calculate stars based on his performance
    //        if (timeSpent < challenge.ellapsedSeconds) { //if yes, check if he took less than his last time

    //            localStorage["challenge_time_" + challenge.id] = timeSpent;
    //            challenge.ellapsedSeconds = timeSpent;

    //            //TODO: save into server database

    //            return 3;

    //            //if yes, calculate the difference between his last time and now and if the difference is huge, give him 3 stars, if small, give him 2 stars.

    //            //var diff = self.ellapsedSeconds - timeSpent;

    //            //To know if the diff is big or small, we need to use the threshold and the effort to calculate.
    //            /*

    //                Title: System of 3-star rating based on performing achievement (of challenges/tasks).

    //                Description:
    //                This will be used on a video-game where the player will be rewarded one, two or 3 out of 3 stars. 1 = poor, 2 = ok, 3 = great.
    //                There are several challenges/tasks, and each of them take different amounts of seconds to complete. (I will use seconds to measure the time spent)

    //                Example: Task #1 might take 40 seconds, Task #2 might take 600 seconds and Task #3 might take 300 seconds, and so on....

    //                This hypothetical number of seconds, might be given as threshold for each task. (Meaning that any task completed within this threshold is considered at least 1 star)
    //                If this helps, I can give out thresholds.

    //                Every task has also a complexity factor that I can provide if it helps. I call this effort. Effort can be from 1 (easy) to 9 (hard).

    //                Example: Task #1 is hard so effort = 9. Task #2 is easy, effort = 1. Task #3 is more or less, effort = 5.

    //                As you can see, there's no correlation between effort and threshold.

    //                The problem is: I have no idea how long each task would take (in other words, I don't have a threshold unless I complete each task myself and measure
    //                    my performance). If i had the threshold, it would be simple to just do this:

    //                    if time spent by player < a certain amount of seconds (ex: 20) then star = 3
    //                    if time spent by player < another amount of  seconds (ex: 40) then star = 2
    //                    else star = 1

    //                However, I don't want to reward every player using the same threshold, because everyone has their own pace, so I use their own performance for the calculation.

    //                If I had access to the time spent of 1000 players, I could make an average of all of them and calculate based on that. That would be the perfect threshold. Until then,

    //                It's not acurate to use player's last time performance, because he might had got his best and will never improve his own. So I need to measure my own threshold for each task.

    //                However, I will use his last performance anyways as a threshold. But I will still use my own, just in case.

    //                And then, calculate the percentage of that 2 times for: hard_effort = 9 (3 stars) and medium_effort = 5 (2 stars). 1 star will be whatever else.

    //                So I need to evaluate whether or not to use his actual performance as a threshold in the future (and give him 1 star) or use mine.

    //                So first, I have to compare his actual spent time with my threshold and if the difference is big for less, he is very good. If it's for more, he is very weak.

    //                My threshold is of a good player.

    //                f(d) = timeSpent - threshold

    //                if d < 0 then he is good
    //                else he is bad

    //                But I still don't know if I should use his or my threshold is good.

    //                So I have to calculate if the diference is too big for less, then I'll use mine because he is very good. To know if the difference is too big, I calculate:

    //                f(b) = |d|

    //                f(x) = threshold - (threshold * ((10 - effort) / 10))

    //                if he is good then
    //                    if x > 


    //                f(y) = timeSpent - x


    //                if d is bigger than x


    //                if x < 0 then star 3
    //                else if x > 0 then star 2
    //                else star 1

    //                Examples:

    //                Challenge/task with threshold of 40

    //                d = 18 - 40 //very good, use mine threshold, he might not beat his again, threshold = 40, 3 stars
    //                d = -22
    //                          hard_effort    medium_effort
    //                b = 22  >      4       >      20 

    //                d = 38 - 40 //good, use his threshold, he can still make it better, threshold = 38, 2 stars
    //                d = -2
    //                          hard_effort    medium_effort
    //                b = 2  <      4       <      20 

    //                d = 36 - 40 //good, use his threshold, he can still make it better, threshold = 36, 2 stars
    //                d = -4
    //                          hard_effort    medium_effort
    //                b = 4  =      4       <      20 

    //                d = 28 - 40 //better, use avg of hard and medium efforts, threshold = 32, 3 stars
    //                d = -12
    //                          hard_effort    medium_effort
    //                b = 12  >      4       <      20 



    //                d = 70 - 40 //very bad, use his threshold, threshold = 50
    //                d = 30
    //                b = 30

    //                d = 50 - 40 //bad, use mine threshold, threshold = 40
    //                d = 10
    //                b = 10 >

    //                x = 40 * (hard_effort / 10)
    //                x = 40 * (9 / 10)
    //                x = 40 * 0.9
    //                x = 36

    //                x = 40 * (medium_effort / 10)
    //                x = 40 * (5 / 10)
    //                x = 20

    //                avg(40 + 36 + 20) = 32 
    //                40 - 32 = 8

    //                y = 50 - 20
    //                y = 30

    //                if timeSpent < 36 then star = 3
    //                if timeSpent < 20 then star = 2
    //                else star = 2

    //                challenge with threshold of 600, effort = 8 (hard)

    //                600 * 0.8 = 480 - 600 = 120
    //                if diff < 36 then star = 3
    //                else star = 2

    //                challenge with threshold of 100, effort = 2 (easy)

    //                100 * 0.2 = 20 - 100 = 80
    //                if diff < 36 then star = 3
    //                else star = 2

    //                challenge with threshold of 720, effort = 1 (easy)

    //                720 * 0.1 = 72 - 720 = 648
    //                if diff < 36 then star = 3
    //                else star = 2

    //                challenge with threshold of 300, effort = 5 (moderate)

    //                300 * 0.5 = 150 - 300 = 150
    //                if diff < 36 then star = 3
    //                else star = 2


    //            */
    //            //effort = effort / 10;

    //            //var big (threshold - ;
    //            //var small;
    //            // big

    //        } else {
    //            return challenge.stars;
    //        }

    //    } else { //if not, we will use the average of all players, until we don't have that, we can calculate the threshold and the effort

    //        if (timeSpent < stars3) {

    //            return 3;

    //        } else if (timeSpent < stars2) {

    //            return 2;

    //        } else {

    //            return 1;

    //        }

    //    }

    //},

    //starChallengeBasedOnTime: function (challenge, stars3, stars2) {

    //    var timeSpent = tetris.getEllapsedTime();

    //    if (isNaN(timeSpent))
    //        return challenge.stars;

    //    if (challenge.ellapsedSeconds > 0) { //check if player already have challenged this, if yes calculate stars based on his performance
    //        if (timeSpent < challenge.ellapsedSeconds) { //if yes, check if he took less than his last time

    //            localStorage["challenge_time_" + challenge.id] = timeSpent;
    //            challenge.ellapsedSeconds = timeSpent;

    //            //TODO: save into server database

    //            return 3;

    //        } else { //nothing changes

    //            return challenge.stars;

    //        }

    //    } else { //if not, we will use the average of all players, until we don't have that, we can calculate the threshold and the effort

    //        localStorage["challenge_time_" + challenge.id] = timeSpent;

    //        if (timeSpent < stars3) {

    //            //TODO: save into server database

    //            return 3;

    //        } else if (timeSpent < stars2) {

    //            //TODO: save into server database

    //            return 2;

    //        } else {

    //            //TODO: save into server database

    //            return 1;

    //        }

    //    }

    //},

    starChallenge: function (challenge, type, min) {

        if (typeof (min) == "undefined" || min == null)
            min = 0;

        var stars = 0;

        if (type == 'score') {
            stars = tetris.starChallengeBasedOnScore(challenge, min);

        } else {
            stars = tetris.starChallengeBasedOnTime(challenge, min);
        }

        if (stars > 0) {
            if (tetris.challenge_score > challenge.score) {
                localStorage["challenge_score_" + challenge.id] = tetris.challenge_score;
                challenge.score = tetris.challenge_score;
            }
            var ellapsedTime = tetris.getEllapsedTime();
            if ((ellapsedTime < challenge.ellapsedSeconds) || challenge.ellapsedSeconds == 0) {
                localStorage["challenge_time_" + challenge.id] = ellapsedTime;
                challenge.ellapsedSeconds = ellapsedTime;
            }
        }

        return stars;
    },

    starChallengeBasedOnScore: function (challenge, min) {

        switch (challenge.stars) {
            case 1:
                return 2;
            case 2:
                return 3;
            case 3:
                return 3;
            default:
                if (tetris.challenge_score > min)
                    return 1;
        };

        return 0;

    },

    starChallengeBasedOnTime: function (challenge, min) {

        switch (challenge.stars) {
            case 1:
                return 2;
            case 2:
                return 3;
            case 3:
                return 3;
            default:
                if (tetris.getEllapsedTime() < min || min == 0)
                    return 1;
        };

        return 0;

    },

    //starChallengeBasedOnScore: function (challenge, stars3, stars2) {

    //    if (challenge.score > 0) { //check if player already have challenged this, if yes calculate stars based on his performance
    //        if (challenge.score > tetris.score) { //if yes, check if he took less than his last time

    //            localStorage["challenge_score_" + challenge.id] = tetris.score;
    //            challenge.score = tetris.score;

    //            //TODO: save into server database

    //            return 3;

    //        } else { //nothing changes

    //            return challenge.stars;
    //        }

    //    } else { //if not, we will use the average of all players, until we don't have that, we can calculate the threshold and the effort

    //        localStorage["challenge_score_" + challenge.id] = tetris.score;

    //        if (tetris.score > stars3) {

    //            //TODO: save into server database

    //            return 3;

    //        } else if (tetris.score > stars2) {

    //            //TODO: save into server database

    //            return 2;

    //        } else {

    //            //TODO: save into server database

    //            return 1;

    //        }

    //    }

    //},

    initChallenges: function () {

        var arr = Helper.incrementalArray(1, 99, 0.1);

        var chalenge_list = document.getElementById('chalenge_list');

        var max = arr.length;

        for (i = 0; i < max; i++) {

            var challenge = new Challenge();

            challenge.div = document.createElement("div");
            challenge.div.setAttribute("class", "challenge notdone");
            challenge.div.setAttribute("style", "z-index:" + (max - i));
            challenge.textDiv = document.createElement("div");
            challenge.textDiv.setAttribute("class", "text");
            challenge.textDiv.setAttribute("style", "z-index:" + (max - i));

            challenge.hintSpan = document.createElement("span");
            challenge.hintSpan.setAttribute("class", "hint");
            challenge.div.setAttribute("style", "z-index:" + (max - i));

            challenge.starDiv = document.createElement("div");
            challenge.starDiv.setAttribute("class", "star");

            challenge.starSpan = document.createElement("span");
            challenge.starDiv.appendChild(challenge.starSpan);

            var id = arr[i];

            switch (id) {
                case 1:
                    challenge.text = "Clear 1 line";
                    challenge.hintText = "Use blocks also known as tetriminos to build lines.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_lines >= 1)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 1.1:
                    challenge.text = "Clear 4 lines";
                    challenge.hintText = "Clear four lines.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_lines >= 4)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 1.2:
                    challenge.text = "Clear 2 lines at once";
                    challenge.hintText = "Build two lines and clear them using one tetrimino. This is known as a Double bonus.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_double >= 1 || tetris.challenge_count_triple >= 1 || tetris.challenge_count_tetris >= 1)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 1.3:
                    challenge.text = "Clear 3 lines at once";
                    challenge.hintText = "Build three lines and clear them using one tetrimino. This is known as a Triple bonus.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_triple >= 1 || tetris.challenge_count_tetris >= 1)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 1.4:
                    challenge.text = "Clear 4 lines at once";
                    challenge.hintText = "Only the I shaped tetrimino has the capacity to clear four lines simultaneously. This is known as a Tetrimino bonus (capital T).";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_tetris >= 1)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 1.5:
                    challenge.text = "Clear 2 lines in less than 10 seconds";
                    challenge.hintText = "Try to clear two lines as fast as you can.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_lines >= 2 && tetris.getEllapsedTime() < 10)
                            return tetris.starChallenge(c, 'time');
                        else if (tetris.getEllapsedTime() >= 10) {
                            c.tried = true;
                            localStorage["challenge_tried_" + c.id] = true;
                            tetris.challengeFailedMessage("CHALLENGE FAILED");
                        }
                        return 0;
                    };
                    break;
                case 1.6:
                    challenge.text = "Fast-drop 3 blocks to score extra points";
                    challenge.hintText = "You score more points for swiping tetriminos down with your finger, or pressing space bar on the keyboard.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_drops >= 3)
                            return tetris.starChallenge(c, 'score');
                        return 0;
                    };
                    break;
                case 2:
                    challenge.text = "Stay alive for 1 minute";
                    challenge.hintText = "Clear as many lines as you can. Use the space bar or swipe the blocks down to gain speed.";
                    challenge.clause = function (c) {
                        if (tetris.getEllapsedTime() >= 60)
                            return tetris.starChallenge(c, 'score');
                        return 0;
                    };
                    break;
                case 3:
                    challenge.text = "Score 500 points extra";
                    challenge.hintText = "Reach 500 points more than what you have when you start this challenge.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_score >= 500)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 4:
                    challenge.text = "Clear 4 lines in less than 20 seconds";
                    challenge.hintText = "Try to clear seven lines now as fast as you can.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_lines >= 4 && tetris.getEllapsedTime() < 20)
                            return tetris.starChallenge(c, 'time');
                        else if (tetris.getEllapsedTime() >= 20) {
                            c.tried = true;
                            localStorage["challenge_tried_" + c.id] = true;
                            tetris.challengeFailedMessage("CHALLENGE FAILED");
                        }
                        return 0;
                    };
                    break;
                case 5:
                    challenge.text = "Clear 2 Double lines";
                    challenge.hintText = "Try to use square shaped tetriminos to complete this challenge. Triple lines or a Tetrimino won't count.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_double >= 2)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 6:
                    challenge.text = "Fast-drop 10 blocks";
                    challenge.hintText = "Swipe ten tetriminos down with your finger. Press space bar if using the keyboard.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_drops >= 10)
                            return tetris.starChallenge(c, 'score');
                        return 0;
                    };
                    break;
                case 6.1:
                    challenge.text = "Pile 21 tetriminos in sequence without clearing a single line";
                    challenge.hintText = "You must not clear lines in this challenge. Leave at least one empty spot per line.";
                    challenge.clause = function (c) {
                        if (tetris.last_count_noclear_sequence >= 21)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 7:
                    challenge.text = "Reach a new level";
                    challenge.hintText = "You must reach a new level from when you start this challenge. If you start at level 1, you must reach level 2, and so on.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_levelJumps >= 1)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 7.1:
                    challenge.text = "Score 1000 points extra";
                    challenge.hintText = "Reach 1000 points more than what you have when you start this challenge.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_score >= 1000)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 7.2:
                    challenge.text = "Clear 6 lines in less than 30 seconds";
                    challenge.hintText = "Try to clear six lines now as fast as you can.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_lines >= 6 && tetris.getEllapsedTime() < 30)
                            return tetris.starChallenge(c, 'time');
                        else if (tetris.getEllapsedTime() >= 30) {
                            c.tried = true;
                            localStorage["challenge_tried_" + c.id] = true;
                            tetris.challengeFailedMessage("CHALLENGE FAILED");
                        }
                        return 0;
                    };
                    break;
                case 8:
                    challenge.text = "Stay alive for 2 minutes";
                    challenge.hintText = "Stay alive, you must.";
                    challenge.clause = function (c) {
                        if (tetris.getEllapsedTime() >= (60 * 2))
                            return tetris.starChallenge(c, 'score');
                        return 0;
                    };
                    break;
                case 9:
                    challenge.text = "On level 4 or higher, reach a new level";
                    challenge.hintText = "Clear lines to make your way up faster.";
                    challenge.clause = function (c) {
                        if (tetris.level >= 4 && tetris.challenge_levelJumps >= 1)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 10:
                    challenge.text = "Clear 2 Triple lines";
                    challenge.hintText = "Try to use an L shaped tetrimino to complete this challenge.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_triple >= 2)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 11:
                    challenge.text = "Fast-drop 10 blocks on level 4 or beyond";
                    challenge.hintText = "Swipe ten tetriminos down with your finger or use the space bar on the keyword. But do it on level 4 or beyond.";
                    challenge.clause = function (c) {
                        if (tetris.level >= 4 && tetris.getAccumulatedCountDrops(4) >= 10)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 11.1:
                    challenge.text = "Clear 8 lines in less than 40 seconds";
                    challenge.hintText = "Try to clear seven lines now as fast as you can.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_lines >= 8 && tetris.getEllapsedTime() < 40)
                            return tetris.starChallenge(c, 'time');
                        else if (tetris.getEllapsedTime() >= 40) {
                            c.tried = true;
                            localStorage["challenge_tried_" + c.id] = true;
                            tetris.challengeFailedMessage("CHALLENGE FAILED");
                        }
                        return 0;
                    };
                    break;
                case 11.2:
                    challenge.text = "Score 2000 points extra";
                    challenge.hintText = "Reach 2000 points more than what you have when you start this challenge.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_score >= 2000)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 12:
                    challenge.text = "Stay alive for 4 minutes";
                    challenge.hintText = "If you can pass this challenge, you are up for the next ones.";
                    challenge.clause = function (c) {
                        if (tetris.getEllapsedTime() >= (60 * 4))
                            return tetris.starChallenge(c, 'score');
                        return 0;
                    };
                    break;
                case 13:
                    challenge.text = "Pile 32 tetriminos in sequence without clearing a line";
                    challenge.hintText = "You don't even have to clear lines. Piece of cake, or is it?";
                    challenge.clause = function (c) {
                        if (tetris.last_count_noclear_sequence >= 32)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 14:
                    challenge.text = "Clear 4 Double lines";
                    challenge.hintText = "Try to use square shaped tetriminos. Triple lines or a Tetrimino won't count.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_double >= 4)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 15:
                    challenge.text = "Hit the floor once after a line is cleared";
                    challenge.hintText = "You must place a block on the floor after the floor has piled up and you've cleared a line.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_floor_hits >= 1)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 16:
                    challenge.text = "Reach a new level in less than 50 seconds";
                    challenge.hintText = "You must reach a new level from when you start this challenge. If you start at level 1, you must reach level 2, and so on.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_levelJumps >= 1 && tetris.getEllapsedTime() < 50)
                            return tetris.starChallenge(c, 'time');
                        else if (tetris.getEllapsedTime() >= 50) {
                            c.tried = true;
                            localStorage["challenge_tried_" + c.id] = true;
                            tetris.challengeFailedMessage("CHALLENGE FAILED");
                        }
                        return 0;
                    };
                    break;
                case 17:
                    challenge.text = "Clear 3 Triple lines";
                    challenge.hintText = "Try to use an L shaped tetrimino to complete this challenge.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_triple >= 3)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 18:
                    challenge.text = "Clear 2 Tetriminos in one game";
                    challenge.hintText = "Remember: Only the I shaped tetrimino has the capacity to clear four lines simultaneously and cause a Tetrimino (capital T).";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_tetris >= 2)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 19:
                    challenge.text = "Fast-drop 10 blocks on level 8 or beyond";
                    challenge.hintText = "Swipe ten tetriminos down with your finger or use the space bar on the keyword. But do it on level 8 or beyond.";
                    challenge.clause = function (c) {
                        if (tetris.level >= 8 && tetris.count_drops[8] >= 10)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 20:
                    challenge.text = "Stay alive for 6 minutes";
                    challenge.hintText = "Test your endurance with this challenge.";
                    challenge.clause = function (c) {
                        if (tetris.getEllapsedTime() >= (60 * 6))
                            return tetris.starChallenge(c, 'score');
                        return 0;
                    };
                    break;
                case 20.1:
                    challenge.text = "Score 1000 points extra in less than 40 seconds";
                    challenge.hintText = "Reach 1000 points more than what you have when you start this challenge.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_score >= 1000 && tetris.getEllapsedTime() < 40)
                            return tetris.starChallenge(c, 'time');
                        else if (tetris.getEllapsedTime() >= 40) {
                            c.tried = true;
                            localStorage["challenge_tried_" + c.id] = true;
                            tetris.challengeFailedMessage("CHALLENGE FAILED");
                        }
                        return 0;
                    };
                    break;
                case 21:
                    challenge.text = "Pile 20 tetriminos in sequence without clearing a single line and then clear 1 line";
                    challenge.hintText = "Test your come-backs.";
                    challenge.clause = function (c) {
                        if (tetris.last_count_blocks_sequence >= 20 && tetris.challenge_lines >= 1)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;

                case 21.1:
                    challenge.text = "Clear 2 Double lines and 1 Triple line";
                    challenge.hintText = "Practice leads to expertise.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_double >= 2 && tetris.challenge_count_triple >= 1)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;

                case 21.2:
                    challenge.text = "Score 8000 points extra";
                    challenge.hintText = "Reach 8000 points more than what you have when you start this challenge.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_score >= 8000)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;

                case 21.3:
                    challenge.text = "Clear 2 double lines in sequence";
                    challenge.hintText = "Clear 2 double lines in sequence without placing any other block. Luck plays a role in this challenge.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_double >= 2 && tetris.count_noclear_sequence == 0)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;

                case 21.4:
                    challenge.text = "Stay alive for 8 minutes";
                    challenge.hintText = "Test your endurance with this challenge.";
                    challenge.clause = function (c) {
                        if (tetris.getEllapsedTime() >= (60 * 8))
                            return tetris.starChallenge(c, 'score');
                        return 0;
                    };
                    break;

                case 22:
                    challenge.text = "Clear 4 Tetriminos";
                    challenge.hintText = "So you think you can play Tetriminos?";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_tetris >= 4)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 23:
                    challenge.text = "Hit the floor 4 times";
                    challenge.hintText = "It's important to stay as low as you can.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_floor_hits >= 4)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 23.1:
                    challenge.text = "Score 2000 points extra in less than 90 seconds";
                    challenge.hintText = "Reach 2000 points more than what you have when you start this challenge.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_score >= 2000 && tetris.getEllapsedTime() < 90)
                            return tetris.starChallenge(c, 'time');
                        else if (tetris.getEllapsedTime() >= 90) {
                            c.tried = true;
                            localStorage["challenge_tried_" + c.id] = true;
                            tetris.challengeFailedMessage("CHALLENGE FAILED");
                        }
                        return 0;
                    };
                    break;
                case 24:
                    challenge.text = "Pile 33 tetriminos in sequence without clearing a single line";
                    challenge.hintText = "You don't even have to clear lines. Piece of cake, or is it?";
                    challenge.clause = function (c) {
                        if (tetris.last_count_blocks_sequence >= 33)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 25:
                    challenge.text = "Clear 6 double lines";
                    challenge.hintText = "Let see how many Double lines you can clear in one game.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_double >= 6)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 26:
                    challenge.text = "Fast-drop 10 blocks on level 10 or beyond";
                    challenge.hintText = "Swipe ten tetriminos down on level 10 or beyond.";
                    challenge.clause = function (c) {
                        if (tetris.level >= 10 && tetris.count_drops[10] >= 10)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 27:
                    challenge.text = "Clear 10 bonus lines";
                    challenge.hintText = "I play therefore I exist. Double, Triple and Tetrimino count in this challenge.";
                    challenge.clause = function (c) {
                        if ((tetris.challenge_count_double + tetris.challenge_count_tetris + tetris.challenge_count_triple) >= 10)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 28:
                    challenge.text = "Score 8000 points extra";
                    challenge.hintText = "Reach 8000 points more than what you have when you start this challenge.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_score >= 8000)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 29:
                    challenge.text = "Clear 9 triple lines";
                    challenge.hintText = "Now here is an easy challenge.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_triple >= 9)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 30:
                    challenge.text = "Hit the floor 8 times";
                    challenge.hintText = "You must place blocks on the floor in 8 occasions. So clear lines to stay low.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_floor_hits >= 8)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 31:
                    challenge.text = "Pile 8 lines in sequence without clearing them and then clear 8 lines";
                    challenge.hintText = "'The ego is nothing other than the focus of conscious attention.' - Alan Watts";
                    challenge.clause = function (c) {
                        if (tetris.last_count_blocks_sequence >= 8 && tetris.challenge_lines >= 8)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 32:
                    challenge.text = "Clear 60 lines in less than 4 minutes";
                    challenge.hintText = "Test your might.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_lines >= 60 && tetris.getEllapsedTime() < (60 * 4))
                            return tetris.starChallenge(c, 'score');
                        else if (tetris.getEllapsedTime() >= (60 * 4)) {
                            c.tried = true;
                            localStorage["challenge_tried_" + c.id] = true;
                            tetris.challengeFailedMessage("CHALLENGE FAILED");
                        }
                        return 0;
                    };
                    break;
                case 32.1:
                    challenge.text = "Clear 4 single lines in sequence";
                    challenge.hintText = "Double and triple lines are not counted in this challenge.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_single >= 4 && tetris.count_noclear_sequence == 0)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 33:
                    challenge.text = "Stay alive for 10 minutes";
                    challenge.hintText = "'The ultimate measure of a man is not where he stands in moments of comfort and convenience, but where he stands at times of challenge and controversy.' - Martin Luther King, Jr.";
                    challenge.clause = function (c) {
                        if (tetris.getEllapsedTime() >= (60 * 10))
                            return tetris.starChallenge(c, 'score');
                        return 0;
                    };
                    break;
                case 34:
                    challenge.text = "Hit the floor 16 times";
                    challenge.hintText = "'If you're going through hell, keep going.' - Winston Churchill";
                    challenge.clause = function (c) {
                        if (tetris.challenge_floor_hits >= 16)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 34.1:
                    challenge.text = "Score 4000 points extra in less than 3 minutes";
                    challenge.hintText = "Reach 4000 points more than what you have when you start this challenge.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_score >= 4000 && tetris.getEllapsedTime() < (60 * 3))
                            return tetris.starChallenge(c, 'time');
                        else if (tetris.getEllapsedTime() >= (60 * 3)) {
                            c.tried = true;
                            localStorage["challenge_tried_" + c.id] = true;
                            tetris.challengeFailedMessage("CHALLENGE FAILED");
                        }
                        return 0;
                    };
                    break;
                case 35:
                    challenge.text = "Clear 6 Tetriminos";
                    challenge.hintText = "Luck plays an important role in Tetriminos.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_tetris >= 6)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;

                case 36:
                    challenge.text = "Stay alive for 12 minutes";
                    challenge.hintText = "Clearly you haven't given up.";
                    challenge.clause = function (c) {
                        if (tetris.getEllapsedTime() >= (60 * 12))
                            return tetris.starChallenge(c, 'score');
                        return 0;
                    };
                    break;

                case 37:
                    challenge.text = "Clear 100 lines in less than 6 minutes";
                    challenge.hintText = "'If you can dream it, you can do it.' - Walt Disney";
                    challenge.clause = function (c) {
                        if (tetris.challenge_lines >= 100 && tetris.getEllapsedTime() < (60 * 6))
                            return tetris.starChallenge(c, 'score');
                        else if (tetris.getEllapsedTime() >= (60 * 6)) {
                            c.tried = true;
                            localStorage["challenge_tried_" + c.id] = true;
                            tetris.challengeFailedMessage("CHALLENGE FAILED");
                        }
                        return 0;
                    };
                    break;
                case 38:
                    challenge.text = "Fast-drop 2 blocks on level 12";
                    challenge.hintText = "'Never let your ego get so close to your position that when your position goes, your ego goes with it.' - Colin Powell";
                    challenge.clause = function (c) {
                        if (tetris.level >= 12 && tetris.count_drops[12] >= 2)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 39:
                    challenge.text = "Hit the floor 32 times";
                    challenge.hintText = "Life is challenging.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_floor_hits >= 32)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 39.1:
                    challenge.text = "Stay alive for 14 minutes";
                    challenge.hintText = "Clearly you haven't given up.";
                    challenge.clause = function (c) {
                        if (tetris.getEllapsedTime() >= (60 * 14))
                            return tetris.starChallenge(c, 'score');
                        return 0;
                    };
                    break;
                case 40:
                    challenge.text = "Clear 120 lines in less than 10 minutes";
                    challenge.hintText = "Even Masters must test their reflexes.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_lines >= 120 && tetris.getEllapsedTime() < (60 * 10))
                            return tetris.starChallenge(c, 'score');
                        else if (tetris.getEllapsedTime() >= (60 * 10)) {
                            c.tried = true;
                            localStorage["challenge_tried_" + c.id] = true;
                            tetris.challengeFailedMessage("CHALLENGE FAILED");
                        }
                        return 0;
                    };
                    break;
                case 41:
                    challenge.text = "Clear 8 Tetriminos";
                    challenge.hintText = "Clear 4 lines simultaneously 8 times in one game.";
                    challenge.clause = function (c) {
                        if (tetris.challenge_count_tetris >= 8)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 41.1:
                    challenge.text = "Stay alive for 16 minutes";
                    challenge.hintText = "Clearly you haven't given up.";
                    challenge.clause = function (c) {
                        if (tetris.getEllapsedTime() >= (60 * 16))
                            return tetris.starChallenge(c, 'score');
                        return 0;
                    };
                    break;
                case 42:
                    challenge.text = "Beat your own record";
                    challenge.hintText = "If you can beat your own record, you can challenge other players online.";
                    challenge.clause = function (c) {
                        if (tetris.best_score_player == tetris.score)
                            return tetris.starChallenge(c, 'time');
                        return 0;
                    };
                    break;
                case 43:
                    challenge.text = "Compete against other players, download Tetriminos Online today!";
                    break;
                default:
                    break;
            }


            challenge.textDiv.innerHTML = challenge.text;
            challenge.hintSpan.innerHTML = challenge.hintText;

            challenge.starDiv.appendChild(challenge.hintSpan);

            challenge.div.appendChild(challenge.textDiv);
            challenge.div.appendChild(challenge.starDiv);

            if (challenge.clause) {
                challenge.id = id;

                Helper.addClass(challenge.div, challenge.color);

                chalenge_list.appendChild(challenge.div);

                if (tetris.challenges.count() > 0)
                    challenge.prev = tetris.challenges.last();

                challenge.color = tetris.alternateColorChallenge();

                var stars = parseInt(localStorage["challenge_stars_" + challenge.id]);
                if (isNaN(stars))
                    stars = 0;

                //stars = 1;

                challenge.star(stars);

                challenge.ellapsedSeconds = parseInt(localStorage["challenge_time_" + challenge.id]);
                if (isNaN(challenge.ellapsedSeconds))
                    challenge.ellapsedSeconds = 0;

                challenge.score = parseInt(localStorage["challenge_score_" + challenge.id]);
                if (isNaN(challenge.score))
                    challenge.score = 0;

                if (stars > 0) {
                    if (challenge.ellapsedSeconds > 0 && challenge.score > 0) {
                        challenge.hintSpan.innerHTML = challenge.score + " points in " + Helper.ellapsedTimeText(challenge.ellapsedSeconds);
                    } else if (challenge.ellapsedSeconds > 0) {
                        challenge.hintSpan.innerHTML = "Completed in " + Helper.ellapsedTimeText(challenge.ellapsedSeconds);
                    }
                }

                if (new Boolean(localStorage["challenge_tried_" + challenge.id]) == true)
                    challenge.tried = true;

                if (challenge.id === 1 || challenge.stars > 0 || challenge.tried)
                    challenge.activate();

                tetris.challenges.add(challenge);
            }
        };

        var totalChallenges = tetris.challenges.count();

        for (i = totalChallenges - 1; i >= 0; i--) {
            var current = tetris.challenges.get(i);
            if (i < totalChallenges - 1)
                current.next = tetris.challenges.get(i + 1);
        }

        for (i = 0; i < totalChallenges; i++) {
            var current = tetris.challenges.get(i);

            if ((current.done || current.tried) && current.next) {
                current.next.activate();
            }
        }

        //add download div

        tetris.download_div = document.createElement("div");
        tetris.download_div.setAttribute("class", "challenge dlnColor notdone");
            var text = document.createElement("div");
            text.setAttribute("class", "text");
            text.innerHTML = "Compete against other players, download Tetriminos Online today!";
        tetris.download_div.appendChild(text);

        chalenge_list.appendChild(tetris.download_div);

        tetris.download_div.addEventListener("click", function () {

            if (Helper.hasClass(this, "download")){
                var url = new Windows.Foundation.Uri("http://www.lemonwaregames.com/TetriminosOnline")
                Windows.System.Launcher.launchUriAsync(url);
            }

        });

    },

    init: function () {

        tetris.page = document.getElementById('page');

        tetris.page_home = document.getElementById('page_home');
        tetris.page_game = document.getElementById('page_game');
        tetris.page_challenges = document.getElementById('page_challenges');
        tetris.game_col = document.getElementById('game_col');
        tetris.game_zone = document.getElementById('game_zone');
        tetris.messages = document.getElementById('messages');
        tetris.overlay = document.getElementById('overlay');
        tetris.infos = document.getElementById('infos');
        tetris.next_zone = document.getElementById('next_zone');
        tetris.best_zone = document.getElementById('best_zone');
        tetris.score_zone = document.getElementById('score_zone');
        tetris.level_zone = document.getElementById('level_zone');
        tetris.lines_zone = document.getElementById('lines_zone');
        tetris.blocks_zone = document.getElementById('blocks_zone');
        tetris.timer_zone = document.getElementById('timer_zone');

        tetris.challenge_text = document.getElementById('challenge_text');

        tetris.challenge_mode = false; //player has to go to challenges to initiate challenge.

        tetris.block_width = tetris.pageOffsetWidth() * tetris.block_width_standard;

        tetris.block_height = tetris.block_width;

        if (localStorage["ranking"] != null) {
            ranking.list = JSON.parse(localStorage["ranking"]);
        }

        tetris.stage = new Kinetic.Stage({
            container: 'game_zone',
            width: tetris.cols * tetris.block_width,
            height: (tetris.rows - 1) * tetris.block_width
        });

        tetris.container = document.getElementById('game_col');

        tetris.container.gestureObject = new MSGesture(); // expando on element: tracks the tabletop gesture
        tetris.container.gestureObject.target = tetris.container;
        tetris.container.gestureObject.pointerType = null;

        //var buttons = document.getElementsByClassName('outline-inward');

        //for (var i = 0; i < buttons.length; i++) {
        //    if (typeof buttons[i].onpointerover !== "function") {
        //        buttons[i].addEventListener("pointerover", function (e) {
        //            e.preventDefault();
        //            document.getElementById('button_select').play();
        //        });
        //    }
        //}

        tetris.container.addEventListener("MSGestureTap", function (e) {
            e.preventDefault();
            if (tetris.state == 'game') {
                tetris.holding = true;

                if (tetris.double_tap_time == 0)
                    tetris.double_tap_time = (new Date).getTime();
                else {
                    var now = (new Date).getTime() - tetris.double_tap_time;
                    if (now < 700) {
                        if (!tetris.press_rotate) {
                            tetris.rotate_block();
                            tetris.press_rotate = true;
                        }
                    };
                    tetris.double_tap_time = 0;
                    tetris.holding = false;
                }
            };
        }, false);

        tetris.container.addEventListener("MSGestureStart", function (e) {
            e.preventDefault();

            if (tetris.state == 'game') {

                tetris.last_pos_x = e.offsetX;
                tetris.last_pos_y = e.offsetY;
                tetris.moving = false;
                tetris.finger_lock = false;
            };
        }, false);

        tetris.container.addEventListener("pointerdown", function (e) {
            e.preventDefault();

            if (tetris.state == 'game') {

                if (e.currentTarget.gestureObject.pointerType === null) {               // First contact!

                    e.currentTarget.setPointerCapture(e.pointerId);

                    e.currentTarget.gestureObject.pointerType = e.pointerType;
                    e.currentTarget.gestureObject.addPointer(e.pointerId);

                }
                else if (e.currentTarget.gestureObject.pointerType === e.pointerType) { // Subsequent contact of similar type!

                    e.currentTarget.setPointerCapture(e.pointerId);
                    // e.currentTarget.gestureObject.addPointer(e.pointerId);

                }
                else {                                                                  // Subsequent contact of different type!
                    return;
                }

                if (!e.target.gestureObject) {                                      //  First contact on this element!
                    e.target.gestureObject = new MSGesture();
                    e.target.gestureObject.target = e.target;
                    e.target.gestureObject.pointerType = e.pointerType;

                    //e.target.gestureObject.addPointer(e.pointerId);
                }
                else if (e.target.gestureObject.pointerType === e.pointerType) {    // Subsequent contact of same kind!
                    e.target.gestureObject.addPointer(e.pointerId);
                }
            }

        }, false);

        tetris.container.addEventListener("MSGestureChange", function (e) {
            // prevent window scrolling
            e.preventDefault();
            if (tetris.state == 'game' && tetris.finger_lock == false) {
                var new_pos_x = e.offsetX;
                var new_pos_y = e.offsetY;
                if (new_pos_x - tetris.last_pos_x <= -tetris.block_width) {
                    tetris.holding = true;
                    // finger going left
                    tetris.last_pos_x = new_pos_x;
                    tetris.last_pos_y = new_pos_y;
                    tetris.moving = true;
                    tetris.max_speed_mode = false;
                    tetris.move_left();
                };
                if (new_pos_x - tetris.last_pos_x >= tetris.block_width) {
                    tetris.holding = true;
                    // finger going right
                    tetris.last_pos_x = new_pos_x;
                    tetris.last_pos_y = new_pos_y;
                    tetris.moving = true;
                    tetris.max_speed_mode = false;
                    tetris.move_right();
                };
                if (new_pos_y - tetris.last_pos_y >= tetris.block_width * 3) {
                    // finger going down
                    tetris.last_pos_x = new_pos_x;
                    tetris.last_pos_y = new_pos_y;
                    tetris.moving = true;
                    tetris.max_speed_mode = true;
                    tetris.time_touch_down = (new Date).getTime();
                    clearTimeout(tetris.fall_timeout);
                    tetris.stationary = true;
                    tetris.holding = false;
                    tetris.fall_block(true);
                };
                if (new_pos_y - tetris.last_pos_y <= -tetris.block_width * 0.5) {
                    // finger going up
                    tetris.last_pos_x = new_pos_x;
                    tetris.last_pos_y = new_pos_y;
                    tetris.moving = true;
                    tetris.max_speed_mode = false;
                };

            };
        }, false);

        tetris.container.addEventListener("MSGestureHold", function (e) {
            // prevent window scrolling
            e.preventDefault();
            tetris.holding = true;
        }, false);

        tetris.container.addEventListener('MSGestureEnd', function (e) {
            e.preventDefault();
            tetris.holding = false;
            if (tetris.state == 'game') {
                if (!tetris.moving) {
                    tetris.rotate_block();
                } else {
                    if (tetris.max_speed_mode) {
                        tetris.max_speed_mode = false;
                        var now = (new Date).getTime() - tetris.time_touch_down;
                        if (now < 100) {
                            tetris.drop_block();
                        };
                    };
                    tetris.moving = false; //*** test this
                };
            };
            tetris.press_rotate = false;
        }, false);

        tetris.container.addEventListener('pointerup', function (e) {
            e.preventDefault();
            tetris.press_rotate = false;
            tetris.holding = false;
        }, false);


        tetris.layer_stone = new Kinetic.Layer();
        tetris.layer_shadow = new Kinetic.Layer();
        tetris.layer_block = new Kinetic.Layer();

        for (var i = 1; i < tetris.rows; i++) {

            tetris.display_stone[i] = [];
            tetris.display_shadow[i] = [];
            tetris.display_block[i] = [];

            for (var j = 0; j < tetris.cols; j++) {

                tetris.display_stone[i][j] = tetris.create_group(j * tetris.block_width, (i - 1) * tetris.block_width);

                tetris.layer_stone.add(tetris.display_stone[i][j]);

                tetris.display_shadow[i][j] = tetris.create_shadow(j * tetris.block_width, (i - 1) * tetris.block_width);

                tetris.layer_shadow.add(tetris.display_shadow[i][j]);

                tetris.display_block[i][j] = tetris.create_group(j * tetris.block_width, (i - 1) * tetris.block_width);

                tetris.layer_block.add(tetris.display_block[i][j]);

            };

            tetris.display_line[i] = new Kinetic.Rect({
                id: 'sq',
                x: 0,
                y: (i - 1) * tetris.block_width,
                width: tetris.block_width * tetris.cols,
                height: tetris.block_width,
                fill: '#ffffff'
            });

            tetris.display_line[i].hide();

            tetris.layer_block.add(tetris.display_line[i]);

        };

        //tetris.invisibleLayer = new Kinetic.Layer();

        tetris.stage.add(tetris.layer_stone);
        tetris.stage.add(tetris.layer_shadow);
        tetris.stage.add(tetris.layer_block);
        //tetris.stage.add(tetris.invisibleLayer);

        //tetris.invisibleLayer.draw();

        tetris.layer_stone.draw();
        tetris.layer_shadow.draw();
        tetris.layer_block.draw();

        tetris.next_stage = new Kinetic.Stage({
            container: 'next_zone',
            width: 4 * tetris.block_width,
            height: 4 * tetris.block_width
        });

        tetris.next_layer = new Kinetic.Layer();

        for (var i = 0; i < 4; i++) {
            tetris.display_next[i] = [];
            for (var j = 0; j < 4; j++) {
                tetris.display_next[i][j] = tetris.create_group(j * tetris.block_width, i * tetris.block_width);
                tetris.next_layer.add(tetris.display_next[i][j]);
            };
        };

        tetris.next_stage.add(tetris.next_layer);
        tetris.next_layer.draw();

        tetris.watch_keys();

        tetris.resize();

        //window.addEventListener('resize', function () {
        //    tetris.resize();
        //});

        tetris.bt_new_game = document.getElementById('bt_new_game');
        tetris.bt_new_game.addEventListener('click', function (e) {
            e.preventDefault();
            tetris.challenge_mode = false;
            tetris.show_game();
        });

        tetris.bt_challenges = document.getElementById('bt_challenges');
        tetris.bt_challenges.addEventListener('click', function (e) {
            e.preventDefault();
            tetris.show_challenges();
        });

        tetris.bt_facebook_sign = document.getElementById('bt_facebook_sign');

        tetris.bt_facebook_sign.addEventListener('click', function (e) {
            e.preventDefault();

            if (this.textContent == "FACEBOOK SIGN OFF")
                tetris.signOff();
            else
                tetris.signIn();
                
        });

        // set default mapping
        tetris.set_mapping('a');


        //tetris.show_home();

        tetris.initChallenges();

        WinJS.UI.processAll().then(function () {

            tetris.appBar = document.getElementById("commandsAppBar").winControl;
            tetris.appBar.getCommandById("cmdMute").addEventListener("click", tetris.mute, false);
            tetris.appBar.getCommandById("cmdSignOff").addEventListener("click", tetris.signOff, false);
            tetris.appBar.getCommandById("cmdFx").addEventListener("click", tetris.mutefx, false);
            tetris.appBar.getCommandById("cmdShare").addEventListener("click", tetris.share_facebook, false);
            tetris.appBar.getCommandById("cmdChallenges").addEventListener("click", tetris.show_challenges, false);
            tetris.appBar.getCommandById("cmdPause").addEventListener("click", tetris.pause, false);
            tetris.appBar.getCommandById("cmdHome").addEventListener("click", tetris.show_home, false);
            tetris.appBar.getCommandById("cmdPlay").addEventListener("click", tetris.play_game, false);

            tetris.appBar.getCommandById("cmdPlay").label = "Restart";
            tetris.appBar.getCommandById("cmdPlay").tooltip = "Restart";

            tetris.appBar.addEventListener("beforeshow", function () {

                if (tetris.forcedPause)
                    return

                if (tetris.startingGame)
                    return

                if (tetris.state == 'game_over')
                    return;

                if (!this.disabled && tetris.state != "home" && tetris.state != "challenge") {
                    setTimeout(function () {
                        tetris.pause_game();
                    }, 250);
                }
            });
            tetris.appBar.addEventListener("afterhide", function () {

                if (tetris.forcedPause)
                    return

                if (tetris.startingGame)
                    return

                if (tetris.state == 'game_over')
                    return;

                if (!this.disabled && tetris.state != "home" && tetris.state != "challenge") {
                    setTimeout(function () {
                        tetris.resume_game();
                    }, 250);
                }
            });

            tetris.appBar.disabled = true;
            

            if (tetris.currentAudio) {
                tetris.currentAudio.pause();
                tetris.currentAudio.currentTime = 0;
            }

            tetris.appBar.getCommandById("cmdPause").disabled = true;
            tetris.appBar.getCommandById("cmdPlay").disabled = true;
            tetris.appBar.getCommandById("cmdHome").disabled = true;
            tetris.appBar.getCommandById("cmdShare").disabled = true;
            //tetris.appBar.getCommandById("cmdChallenges").disabled = true;

        });


    },

    resumeorNewGame: function () {
        if (tetris.state == 'pause') {

            //$(tetris.page_challenges).animate({ opacity: 0 }, 400, "linear", function () {
            //    tetris.page_challenges.style.display = 'none';
            //    tetris.page_game.style.display = 'block';
            //    $(tetris.page_game).animate({ opacity: 1 }, 400);
            //});


            tetris.forcedPause = false;
            tetris.resume_game();
            tetris.appBar.hide();

        } else {
            tetris.show_game();
            tetris.appBar.hide();
        }
    },

    mute: function () {
        if (tetris.muted) {
            tetris.muted = false;

            tetris.appBar.getCommandById("cmdMute").label = "No Music";
            tetris.appBar.getCommandById("cmdMute").icon = "mute";
        }
        else {

            tetris.muted = true;
            tetris.appBar.getCommandById("cmdMute").label = "Music";
            tetris.appBar.getCommandById("cmdMute").icon = "audio";

            if (tetris.currentAudio)
                tetris.currentAudio.pause();

        }
    },

    signIn: function () {

        fb.logIn(function () {
            var html = fb.player.name + ", ";
            if (ranking.isRanked(fb.player.id))
                html += "welcome back!";
            else
                html += "welcome to";

            $("#greetings").html(html);
            $("#greetings").show();

            tetris.bt_facebook_sign.textContent = "FACEBOOK SIGN OFF";

            document.getElementById("game").style.display = 'block';
            tetris.show_home();
        });

    },

    signOff: function () {

        fb.logOut();

        tetris.bt_facebook_sign.textContent = "FACEBOOK SIGN IN";

        tetris.appBar.getCommandById("cmdSignOff").disabled = true;

        tetris.appBar.disabled = true;

        tetris.appBar.hide();

        $(tetris.page_home).animate({ opacity: 0 }, 400, "linear", function () {
            tetris.page_home.style.display = 'none';

            $("#greetings").html("Welcome to");

            document.getElementById("welcome").style.display = 'block';
            $("#welcome").animate({ opacity: 1 }, 400, "linear", function () {
                
            });
        });

    },

    mutefx: function (obj) {
        if (tetris.mutedFx) {
            tetris.mutedFx = false;

            if (tetris.appBar.getCommandById("cmdFx")) {
                tetris.appBar.getCommandById("cmdFx").label = "No Fx";
                tetris.appBar.getCommandById("cmdFx").icon = "mute";
            }
        }
        else {
            tetris.mutedFx = true;

            if (tetris.appBar.getCommandById("cmdFx")) {
                tetris.appBar.getCommandById("cmdFx").label = "Fx";
                tetris.appBar.getCommandById("cmdFx").icon = "audio";
            }
        }
    },

    pause: function () {
        if (tetris.startingGame)
            return;

        if (!tetris.forcedPause) {
            tetris.forcedPause = true;
            tetris.pause_game();
            if (tetris.state != 'game_over') {

                tetris.appBar.getCommandById("cmdPlay").label = "Resume";
                tetris.appBar.getCommandById("cmdPlay").tooltip = "Resume";

            }
        }

    },

    create_group: function (x, y) {
        var group = new Kinetic.Group({
            x: x,
            y: y,
            draggable: true,
            dragBoundFunc: function (pos) {
                var newY = pos.y;
                var newX = pos.x;
                if (newX < 0) { newX = 0; }
                if (newX > (tetris.stage.width - tetris.block_width)) { newX = tetris.stage.width - tetris.block_width; }
                if (newY < 0) { newY = 0; }
                if (newY > (tetris.stage.height - tetris.block_height)) { newY = tetris.stage.height - tetris.block_height; }
                return { x: newX, y: newY };
            },
        });
        var square = new Kinetic.Rect({
            id: 'sq',
            x: 0,
            y: 0,
            width: tetris.block_width,
            height: tetris.block_height,
            fill: '#000000'
        });
        var light = new Kinetic.Line({
            x: 0,
            y: 0,
            points: [
              //0, 0,
              //tetris.block_width, 0,
              tetris.block_width * .8, tetris.block_width * .2,
              tetris.block_width * .2, tetris.block_width * .2,
              tetris.block_width * .2, tetris.block_width * .8
              //0, tetris.block_width
            ],
            stroke: 'rgba(255, 255, 255, .3)',
            strokeWidth: 1
        });

        var dark = new Kinetic.Line({
            x: 0,
            y: 0,
            points: [
              //tetris.block_width, tetris.block_width,
              //0, tetris.block_width,
              tetris.block_width * .2, tetris.block_width * .8,
              tetris.block_width * .8, tetris.block_width * .8,
              tetris.block_width * .8, tetris.block_width * .2
              //tetris.block_width, 0
            ],
            stroke: 'rgba(0, 0, 0, .3)',
            strokeWidth: 1
        });

        group.add(square);
        group.add(light);
        group.add(dark);

        return group;
    },

    create_shadow: function (x, y) {
        var square = new Kinetic.Rect({
            id: 'sq',
            x: x,
            y: y,
            opacity: .3,
            width: tetris.block_width,
            height: tetris.block_width,
            fill: '#000000'
        });
        return square;
    },

    updateBestScore: function () {
        var local_best_score = null;

        if (fb.player)
            local_best_score = localStorage.getItem('best_score_player_' + fb.player.id);
        else
            local_best_score = localStorage.getItem('best_score_tetris');

        if (local_best_score != null)
            tetris.best_score_player = local_best_score;
        else {
            local_best_score = localStorage.getItem('best_score_tetris');
            if (local_best_score != null)
                tetris.best_score_player = local_best_score;
        }

        local_best_score = localStorage.getItem('best_score_tetris');

        if (local_best_score != null)
            tetris.best_score_tetris = local_best_score;

        tetris.best_zone.innerHTML = tetris.best_score_player;
    },

    show_home: function () {

        if (tetris.state == 'game')
            tetris.pause();

        CenterIt(document.getElementById('page'));

        tetris.appBar.disabled = true;

        tetris.appBar.getCommandById("cmdSignOff").disabled = (fb.player == null);
        tetris.appBar.getCommandById("cmdChallenges").disabled = true;
        tetris.appBar.getCommandById("cmdHome").disabled = true;
        tetris.appBar.getCommandById("cmdPause").disabled = true;
        tetris.appBar.getCommandById("cmdPlay").disabled = true;
        tetris.appBar.getCommandById("cmdShare").disabled = true;

        tetris.appBar.hide();

        $(tetris.bt_new_game).hide();
        $(tetris.bt_challenges).hide();
        $(tetris.bt_facebook_sign).hide();

        $(tetris.page_challenges).animate({ opacity: 0 }, 400, "linear", function () {
            tetris.page_challenges.style.display = 'none';
            tetris.page_home.style.display = 'block';
            $(tetris.page_home).animate({ opacity: 1 }, 400);
        });

        $(tetris.page_game).animate({ opacity: 0 }, 400, "linear", function () {
            tetris.page_game.style.display = 'none';
            tetris.page_home.style.display = 'block';
            $(tetris.page_home).animate({ opacity: 1 }, 400, "linear", function () {
                $(tetris.bt_new_game).slideDown('fast', function () {
                    CenterIt(document.getElementById('page'));
                });
                $(tetris.bt_challenges).slideDown('fast', function () {
                    CenterIt(document.getElementById('page'));
                });
                $(tetris.bt_facebook_sign).slideDown('fast', function () {
                    CenterIt(document.getElementById('page'));
                });

                //$("#greetings").slideDown('fast');
                tetris.appBar.disabled = false;
            });
        });

        tetris.state = 'home';

        tetris.rePostionAds('home');

        if (tetris.currentAudio)
            tetris.currentAudio.pause();

    },

    show_game: function () {

        $(tetris.page_challenges).animate({ opacity: 0 }, 400, "linear", function () {
            tetris.page_challenges.style.display = 'none';
            tetris.page_game.style.display = 'block';
            $(tetris.page_game).animate({ opacity: 1 }, 400);
        });

        $(tetris.page_home).animate({ opacity: 0 }, 400, "linear", function () {
            tetris.page_home.style.display = 'none';
            tetris.page_game.style.display = 'block';
            $(tetris.page_game).animate({ opacity: 1 }, 400);
        });

        //tetris.game_over();

        //$("#greetings").hide();

        tetris.state = 'game';
        tetris.init_game_confirmed();
    },

    show_challenges: function () {

        CenterIt(document.getElementById('page'));

        if (tetris.startingGame)
            return;

        tetris.appBar.disabled = true;

        if (tetris.state == 'pause' || tetris.state == 'game') {
            tetris.pause();
        }

        tetris.appBar.getCommandById("cmdSignOff").disabled = true;

        var countDone = tetris.challenges.countDone();

        if (countDone > 0)
            if (countDone == tetris.challenges.count()) {
                document.getElementById('aboutChallenge').textContent = 'You have completed all challenges. Stay tuned, more challenges coming soon.';

                Helper.removeClass(tetris.download_div, 'notdone');
                Helper.removeClass(tetris.download_div, "challenge");
                Helper.addClass(tetris.download_div, "download");

            }
            else
                document.getElementById('aboutChallenge').textContent = 'You have completed ' + countDone + ' challenge' + (countDone > 1 ? 's' : '') + '.';
        else
            document.getElementById('aboutChallenge').textContent = 'You have not completed any challenge. Select one.';

        var challenge = tetris.challenges.get(1);
        if (challenge)
            tetris.appBar.getCommandById("cmdShare").disabled = !challenge.done;

        tetris.appBar.getCommandById("cmdHome").disabled = false;
        tetris.appBar.getCommandById("cmdChallenges").disabled = true;

        $(tetris.page_home).animate({ opacity: 0 }, 400, "linear", function () {
            tetris.page_home.style.display = 'none';
            tetris.page_challenges.style.display = 'block';
            $(tetris.page_challenges).animate({ opacity: 1 }, 400);
        });

        $(tetris.page_game).animate({ opacity: 0 }, 400, "linear", function () {
            tetris.page_game.style.display = 'none';
            tetris.page_challenges.style.display = 'block';
            $(tetris.page_challenges).animate({ opacity: 1 }, 400, function () {
                tetris.appBar.show();
                tetris.appBar.disabled = false;
            });
        });


    },

    reauthorizeForPublishPermissions: function () {

        fb.logIn(function () {
            tetris.publishStatus();
        });

    },

    publishStatus: function () {

        var message = "I scored " + tetris.score + " points and cleared " + tetris.lines + " lines in " + tetris.name + "!";

        if (fb.player) {
            var position = ranking.position(fb.player.id);
            if (position) {
                position++
                if (ranking.higherRank) {
                    message = "I ranked #" + position + " in " + tetris.name + "!";
                }
            }
        }

        if (tetris.page_challenges.style.display == 'block') {
            //find the latest challenge done
            var lastDoneChallenge = tetris.challenges.lastDone();

            message = "Accomplished: " + lastDoneChallenge.text + "! #TetrisChallenge \nScored " + lastDoneChallenge.score + " pts in " + Helper.ellapsedTimeTextTrim(lastDoneChallenge.ellapsedSeconds) + " seconds";
        }

        FB.api('me/feed', 'post',
            {
                message: message,
                link: 'http://www.lemonwaregames.com/Tetriminos2',
                picture: 'http://lemonwaregames.files.wordpress.com/2014/02/256.png'

            }, function (res) {
                if (!res || res.error || res.error_msg) {
                    tetris.reauthorizeForPublishPermissions();
                } else {
                    window.onDialogOpen = true;
                    var alertBox = (new Windows.UI.Popups.MessageDialog("Your score was shared!", tetris.name));
                    alertBox.showAsync().done(function () {
                        window.onDialogOpen = false;
                    });
                }
            }
        );

    },

    set_mapping: function (type) {
        tetris.mappings['32'] = 'drop';   // 32 = Space
        tetris.mappings['38'] = 'rotate'; // 38 = Up
    },

    init_game_confirmed: function () {

        tetris.state = 'game';

        tetris.forcedPause = false;
        tetris.calledPause = false;

        tetris.level = 0;
        tetris.challenge_levelJumps = 0;
        tetris.count_drops = [0];

        if (!tetris.challenge_mode)
            tetris.challenge_text.innerHTML = "";

        tetris.level_zone.innerHTML = tetris.level;

        tetris.speed = tetris.init_speed;
        tetris.lines = 0;

        tetris.lines_zone.innerHTML = tetris.lines;
        tetris.blocks_zone.innerHTML = 0;
        tetris.timer_zone.innerHTML = "";
        tetris.score = 0;
        tetris.challenge_score = 0;
        tetris.score_zone.innerHTML = tetris.score;
        tetris.count_blocks = 0;
        tetris.count_blocks_sequence = 0;
        tetris.last_count_blocks_sequence = 0;

        tetris.count_noclear = 0;
        tetris.count_noclear_sequence = 0;
        tetris.last_count_noclear_sequence = 0;

        tetris.count_single = 0;
        tetris.count_double = 0;
        tetris.count_triple = 0;
        tetris.count_tetris = 0;

        tetris.challenge_lines = 0;
        tetris.challenge_count_single = 0;
        tetris.challenge_count_double = 0;
        tetris.challenge_count_triple = 0;
        tetris.challenge_count_tetris = 0;

        tetris.floor_hits = 0;
        tetris.challenge_floor_hits = 0;

        tetris.clear_board();

        tetris.best_zone.style.color = "#333";

        tetris.rePostionAds('game');

        document.getElementById('ad1').style.display = "block";

        document.getElementById('ad1').winControl.isAutoRefreshEnabled = false;
        document.getElementById('ad1').winControl.refresh();
        document.getElementById('ad1').winControl.isAutoRefreshEnabled = true;

        document.getElementById('ad2').winControl.isAutoRefreshEnabled = false;
        document.getElementById('ad2').winControl.refresh();
        document.getElementById('ad2').winControl.isAutoRefreshEnabled = true;


        for (var i = 0; i < tetris.qtySoundTracks; i++) {
            tetris.audios.push(document.getElementById('music_' + i));
            tetris.audios[i].addEventListener('ended', tetris.stoppedAudio);
        }

        tetris.appBar.hide();

        tetris.appBar.getCommandById("cmdShare").disabled = true;
        tetris.appBar.getCommandById("cmdChallenges").disabled = true;
        tetris.appBar.getCommandById("cmdPause").disabled = true;
        tetris.appBar.getCommandById("cmdPlay").disabled = true;
        tetris.appBar.getCommandById("cmdHome").disabled = true;
        tetris.appBar.getCommandById("cmdSignOff").disabled = true;

        tetris.appBar.getCommandById("cmdPlay").label = "Restart";
        tetris.appBar.getCommandById("cmdPlay").tooltip = "Restart";

        tetris.startingGame = true;

        setTimeout(function () {

            tetris.currentAudio = tetris.audios[5];

            if (!tetris.muted)
                tetris.currentAudio.play();

        }, 2500);

        var seconds = 0;
        var startInterval = setInterval(function () {

            if (tetris.secondsToStartGame > seconds) {

                tetris.playSound("beep");

                tetris.message((tetris.secondsToStartGame - seconds).toString());
                seconds++;

            } else {
                tetris.startTimer();

                clearInterval(startInterval);
                tetris.overlay.style.display = 'none';

                tetris.create_block();

                tetris.startingGame = false;

                tetris.appBar.getCommandById("cmdPause").disabled = false;
                tetris.appBar.getCommandById("cmdPlay").disabled = false;
                tetris.appBar.getCommandById("cmdHome").disabled = false;
                tetris.appBar.getCommandById("cmdChallenges").disabled = false;
            }

        }, 1000);

    },

    rePostionAds: function (where) {

        document.getElementById('ad1').style.display = "block";

        document.getElementById('ad2').style.display = "block";

        document.getElementById('ad2').style.left = (window.innerWidth - 360) + "px";
        document.getElementById('ad2').style.top = ((window.innerHeight / 2) - 300) + "px";

        document.getElementById('ad1').style.left = "100px";

        document.getElementById('ad1').style.top = ((window.innerHeight / 2) - 300) + "px";

    },

    play_game: function () {

        if (tetris.appBar.getCommandById("cmdPlay").label == "Resume") {
            tetris.forcedPause = false;
            tetris.resume_game();
        } else {
            tetris.init_game();
        }
    },

    stoppedAudio: function (e) {

        if (tetris.muted)
            return;

        if (tetris.currentAudioIndex == 4)
            tetris.currentAudioIndex = 0;
        else
            tetris.currentAudioIndex++;

        tetris.currentAudio = tetris.audios[tetris.currentAudioIndex];
        tetris.currentAudio.play();

    },

    init_game: function (challenge) {

        tetris.forcedPause = true;
        tetris.pause_game();

        if (tetris.startingGame)
            return;

        if (typeof challenge == "undefined" || challenge == null) {

            var msgBox = "";
            if (tetris.challenge_mode)
                msgBox = "Do you want start the challenge over?";
            else
                msgBox = "Do you want to start a new game?";

            var alertBox = (new Windows.UI.Popups.MessageDialog(msgBox, tetris.name));

            alertBox.commands.append(new Windows.UI.Popups.UICommand("Yes", null, 1));
            alertBox.commands.append(new Windows.UI.Popups.UICommand("Cancel", null, 2));

            alertBox.defaultCommandIndex = 1;
            alertBox.cancelCommandIndex = 1;

            return alertBox.showAsync().then(function (command) {
                if (command) {
                    if (command.id == 1) {

                        clearTimeout(tetris.fall_timeout);
                        tetris.currentAudioIndex = 0;

                        tetris.init_game_confirmed();
                        return true;
                    }
                    else if (command.id == 2) {
                        tetris.forcedPause = false;
                        tetris.calledPause = false;
                        tetris.resume_game();
                        return false;
                    }
                }
            });

        } else {
            tetris.appBar.disabled = false;

            tetris.challenge_text.innerHTML = challenge.text;
            tetris.challenges.current = challenge;
            tetris.challenge_mode = true;

            tetris.show_game();
        }

    },

    clear_board: function () {
        for (var i = 0; i < tetris.rows; i++) {
            tetris.board[i] = [];
            for (var j = 0; j < tetris.cols; j++) {
                tetris.board[i][j] = {
                    stone: false,
                    block: false,
                    shadow: false,
                    updated: true,
                    color: null
                };
            };
        };
        tetris.show_stone();
    },

    get_random_block: function () {
        // find random number according to probability
        var rand = Math.random() * 7;
        var stop = 0;
        rand -= tetris.tab_probability[stop];
        while (rand > 0) {
            stop++;
            if (stop > 6) {
                break;
            };
            rand -= tetris.tab_probability[stop];
        }
        // redistribute probability
        var to_distribute = tetris.tab_probability[stop] * .5;
        tetris.tab_probability[stop] *= .5;
        for (var j = 0; j < 7; j++) {
            if (j != stop) {
                tetris.tab_probability[j] += to_distribute / 6;
            };
        }
        return stop;
    },

    create_next_block: function () {
        tetris.next_block = tetris.get_random_block();
        tetris.next_block_pos = Math.floor(Math.random() * tetris.shape[tetris.next_block].length);
        tetris.show_next();
    },

    create_block: function () {

        tetris.count_blocks++;
        tetris.count_blocks_sequence++;
        tetris.last_count_blocks_sequence = tetris.count_blocks_sequence;

        tetris.blocks_zone.innerHTML = tetris.last_count_blocks_sequence;


        tetris.max_speed_mode = false;
        if (tetris.block == null || tetris.block_pos == null) {
            tetris.create_next_block();
        };
        tetris.block = tetris.next_block;


        tetris.block_pos = tetris.next_block_pos;

        tetris.create_next_block();

        tetris.block_x = 3;
        tetris.block_y = 0;

        while (!tetris.test_position(tetris.block, tetris.block_pos, tetris.block_x, tetris.block_y)) {
            tetris.block_y--;
        };


        tetris.update_block();

        tetris.fall_timeout = setTimeout(function () {
            tetris.fall_block();
        }, tetris.max_speed_mode ? tetris.max_speed : tetris.speed);

    },

    lock_block: function () {

        clearTimeout(tetris.fall_timeout);

        tetris.finger_lock = true;

        // turn moving block into stone
        for (var i = 0; i < tetris.rows; i++) {
            for (var j = 0; j < tetris.cols; j++) {
                if (tetris.board[i][j].block) {

                    if (i == tetris.rows - 1) { //reached the floor
                        tetris.floor_hits++;
                        if (tetris.challenge_lines > 0)
                            tetris.challenge_floor_hits++;
                    }

                    tetris.board[i][j].block = false;
                    tetris.board[i][j].stone = true;
                    tetris.board[i][j].updated = true;
                    tetris.shine_tab.push({
                        i: i,
                        j: j
                    });

                };
            }
        }

        tetris.shine();

        // check for line creation
        var lines_found = []
        for (var i = tetris.rows - 1; i >= 0; i--) {
            var num_blocks = 0;
            for (var j = 0; j < tetris.cols; j++) {
                if (tetris.board[i][j].stone) {
                    num_blocks++;
                };
            };
            if (num_blocks == tetris.cols) {
                lines_found.push(i);
                tetris.lit_line(i);
            };
        };

        tetris.show_stone();

        if (lines_found.length == 0) { // check for overflowing (game over)

            var game_over = false;
            for (var j = 0; j < tetris.cols; j++) {
                if (tetris.board[0][j].stone) {
                    game_over = true;
                    break;
                };
            };

            if (game_over) {
                tetris.game_over();
            } else {

                tetris.count_noclear++;
                tetris.count_noclear_sequence++;

                tetris.last_count_noclear_sequence = tetris.count_noclear_sequence;

                if (!tetris.forcedPause && !tetris.calledPause)
                    tetris.create_block();
            };

        } else {

            tetris.count_noclear_sequence = 0;
            tetris.count_blocks_sequence = 0;

            tetris.state = 'pause';

            // erase lines and fall blocks
            // add lines to counter

            tetris.lines += lines_found.length;
            tetris.challenge_lines += lines_found.length;

            tetris.lines_zone.innerHTML = tetris.lines;

            // adjust speed

            var prevLevel = tetris.level;

            tetris.level = Math.floor(tetris.lines / 10);

            tetris.level_zone.innerHTML = tetris.level;

            var higherLevel = (tetris.level != prevLevel);

            if (higherLevel) {
                tetris.count_drops.push(0);
                tetris.challenge_levelJumps += 1;
            }

            tetris.speed = tetris.init_speed - tetris.level * 50;

            if (tetris.speed < 100) {
                // maximum difficulty
                tetris.speed = 100;
            };

            //lines_found.length = 4; //force

            var textMsg;

            var score = 0;

            // add points to counter
            switch (lines_found.length) {
                case 1:
                    tetris.count_single++;
                    tetris.challenge_count_single++;
                    score = tetris.SINGLE;

                    if (!higherLevel)
                        tetris.playSound("clear1");
                    break;
                case 2:
                    tetris.count_double++;
                    tetris.challenge_count_double++;
                    score = tetris.DOUBLE;
                    textMsg = 'DOUBLE';

                    if (!higherLevel)
                        tetris.playSound("clear2");

                    break;
                case 3:
                    tetris.count_triple++;
                    tetris.challenge_count_triple++;
                    score = tetris.TRIPLE;
                    textMsg = 'TRIPLE';

                    if (!higherLevel)
                        tetris.playSound("clear3");
                    break;
                case 4:
                    tetris.count_tetris++;
                    tetris.challenge_count_tetris++;
                    score = tetris.TETRIMINOS;
                    textMsg = 'TETRIMINOS';

                    if (!higherLevel)
                        tetris.playSound("clear4");
                    break;
            };

            tetris.challenge_score += score;
            tetris.score += score;

            if (higherLevel && tetris.level > 0) {
                if (textMsg)
                    textMsg += '<br/>LEVEL ' + tetris.level;
                else
                    textMsg = 'LEVEL ' + tetris.level;
                tetris.playSound("stageup");
            }

            if (textMsg)
                tetris.message(textMsg);

            //tetris.score = 200000;
            tetris.score_zone.innerHTML = tetris.score;

            if (tetris.score > tetris.best_score_player) {

                tetris.best_score_player = tetris.score;

                if (fb.player)
                    localStorage.setItem('best_score_player_' + fb.player.id, tetris.best_score_player);
                
                if (tetris.best_score_player > tetris.best_score_tetris)
                    localStorage.setItem('best_score_tetris', tetris.best_score_player);

                tetris.best_zone.innerHTML = tetris.best_score_player;
                tetris.best_zone.style.color = "#423267";
            }


            //if (tetris.trial && displayTrialVersionExpirationTime() <= 0 && tetris.trial) {
            //    if (tetris.level >= 0) {

            //        tetris.pause_game(true);

            //        tetris.endTrail().then(function (proceed) {
            //            if (proceed) {

            //                Windows.ApplicationModel.Store.CurrentApp.requestAppPurchaseAsync(false).done(
            //                    function () {
            //                        if (Windows.ApplicationModel.Store.CurrentApp.licenseInformation.isActive && !Windows.ApplicationModel.Store.CurrentAppSimulator.licenseInformation.isTrial) {

            //                            tetris.calledPause = false;
            //                            tetris.overlay.style.display = 'none';

            //                            if (!tetris.muted && tetris.currentAudio)
            //                                tetris.currentAudio.play();


            //                        } else {
            //                            tetris.game_over(true);
            //                        }
            //                    },

            //                    function () {
            //                        tetris.game_over(true);
            //                    }
            //               );

            //            }

            //        });



            //    }
            //}

            tetris.blockIt(lines_found);

        };

        if (tetris.challenge_mode)
            tetris.challenges.current.do();
    },

    blockIt: function (lines_found) {

        if (tetris.calledPause) {
            setTimeout(tetris.blockIt, 250, lines_found);
        } else {

            setTimeout(function () {

                if (tetris.lines == 0)
                    return;

                if (!lines_found || tetris.rows <= 0)
                    return;

                // fall blocks
                var hole = 0;
                for (var i = tetris.rows - 1; i >= 0; i--) {
                    var hole_found = false;
                    for (var k = 0; k < lines_found.length; k++) {
                        if (lines_found[k] == i - hole) {
                            hole_found = true;
                        };
                    }
                    while (hole_found) {
                        hole++;
                        hole_found = false;
                        for (var k = 0; k < lines_found.length; k++) {
                            if (lines_found[k] == i - hole) {
                                hole_found = true;
                            };
                        }
                    };
                    // copy line
                    for (var j = 0; j < tetris.cols; j++) {
                        if (i - hole >= 0) {
                            tetris.board[i][j].stone = tetris.board[i - hole][j].stone;
                            tetris.board[i][j].block = tetris.board[i - hole][j].block;
                            tetris.board[i][j].shadow = tetris.board[i - hole][j].shadow;
                            tetris.board[i][j].color = tetris.board[i - hole][j].color;
                            tetris.board[i][j].updated = true;
                        } else {
                            tetris.board[i][j].stone = false;
                            tetris.board[i][j].block = false;
                            tetris.board[i][j].shadow = false;
                            tetris.board[i][j].color = null;
                            tetris.board[i][j].updated = true;
                        };
                    };
                };
                tetris.show_stone();
                tetris.state = 'game';
                tetris.create_block();

            }, 300);

        }
    },

    //endTrail: function(){
    //    var alertBox = (new Windows.UI.Popups.MessageDialog("Your trial period has expired. Do you want to upgrade to the fully-licensed version now?", tetris.name));

    //    alertBox.commands.append(new Windows.UI.Popups.UICommand("Yes", null, 1));
    //    alertBox.commands.append(new Windows.UI.Popups.UICommand("Cancel", null, 2));

    //    alertBox.defaultCommandIndex = 0;
    //    alertBox.cancelCommandIndex = 1;

    //    return alertBox.showAsync().then(function (command) {
    //        if (command) {
    //            if (command.id == 1) {
    //                return true;
    //            }
    //            else if (command.id == 2) {
    //                tetris.show_home();
    //                return false;
    //            }
    //        }
    //    });
    //},

    //tryUpgradeTrial: function (msg) {
    //    var alertBox = (new Windows.UI.Popups.MessageDialog(msg, tetris.name));

    //    alertBox.commands.append(new Windows.UI.Popups.UICommand("OK", null, 1));

    //    alertBox.defaultCommandIndex = 0;

    //    return alertBox.showAsync().then(function (command) {
    //        if (command) {
    //            if (command.id == 1) {
    //                return;
    //            }
    //        }
    //    });
    //},

    pause_game: function (nofresume) {

        if (tetris.state == 'game_over')
            return;
        if (tetris.startingGame)
            return;

        tetris.pauseTimer();

        tetris.calledPause = true;

        if (tetris.currentAudio)
            tetris.currentAudio.pause();

        tetris.state = 'pause';

        clearTimeout(tetris.fall_timeout);

        var html = '<h2>PAUSE</h2>';

        //if (tetris.challenge_mode)
        //    html += '<div>Timed challenges are paused too not considered on pause.</div>';

        tetris.overlay.innerHTML = html;

        tetris.overlay.style.display = 'block';


    },

    resume_game: function () {

        if (tetris.forcedPause)
            return
        if (tetris.startingGame)
            return;

        if (tetris.state == 'pause') {

            tetris.appBar.hide();

            tetris.appBar.disabled = true;

            tetris.appBar.getCommandById("cmdPlay").label = "Restart";
            tetris.appBar.getCommandById("cmdPlay").tooltip = "Restart";
            tetris.appBar.getCommandById("cmdChallenges").disabled = false;

            $(tetris.page_challenges).animate({ opacity: 0 }, 400, "linear", function () {
                tetris.page_challenges.style.display = 'none';
                tetris.page_game.style.display = 'block';
                $(tetris.page_game).animate({ opacity: 1 }, 400, "linear", function () {
                    tetris.appBar.disabled = false;

                    tetris.calledPause = false;

                    tetris.resumeTimer();

                    tetris.state = 'game';
                    tetris.fall_block();
                    tetris.overlay.style.display = 'none';

                    if (!tetris.muted && tetris.currentAudio)
                        tetris.currentAudio.play();
                });
            });

            //tetris.page_challenges.style.display = 'none';
            //tetris.page_game.style.display = 'block';
            //tetris.page_game.style.opacity = 1;
        }

        //$("#greetings").hide();

    },

    displayScore: function(){

        if (ranking.list == null)
            return;

        setTimeout(function () {
            $(tetris.overlay).slideUp('slow', function () {

                var html = "<h2>TOP 20</h2>";
                html += "<table border='0' cellspacing='6' cellpadding='2' width='100%' class='ranking'><tr>";
                html += "<th class='col_name'>Name</th>";
                html += "<th class='col_score'>Score</th></tr>";

                for (i = 0; i < ranking.list.length; i++) {
                    var p = ranking.list[i];

                    if (fb.player) {
                        html += "<tr><td class='col_name " + (p.name == fb.player.name ? "highlight" : "") + "'>" + p.name + "</td>";
                        html += "<td class='col_score " + (p.name == fb.player.name ? "highlight" : "") + "'>" + p.score + "</td></tr>";
                    } else {
                        html += "<tr><td class='col_name'>" + p.name + "</td>";
                        html += "<td class='col_score'>" + p.score + "</td></tr>";
                    }
                }
                html += '</table>';

                $(tetris.overlay).html(html).slideDown('slow');
            });
        }, 1000);

    },

    askToLogin: function(callback){




        callback();
    },

    game_over: function (NoRestart) {

        tetris.endTimer();

        if (fb.player)
            ranking.set(fb.player.id, fb.player.name, Math.max(tetris.score, tetris.best_score_player), tetris.displayScore);

        //if (!Internet.isConnected()) {
        //     tetris.displayScore();
        //}

        if (tetris.currentAudio) {
            tetris.currentAudio.pause();
            tetris.currentAudio.currentTime = 0;
        }

        tetris.state = 'game_over';

        if (tetris.challenges.current) {
            if (tetris.challenges.current.text == "Stay alive for 12 minutes") {
                if (tetris.getEllapsedTime() >= (60 * 10)) {
                    c.tried = true;
                    localStorage["challenge_tried_" + c.id] = true;
                    tetris.challengeFailedMessage("CHALLENGE FAILED");
                }
            }

            if (tetris.challenges.current.text == "Stay alive for 14 minutes") {
                if (tetris.getEllapsedTime() >= (60 * 12)) {
                    c.tried = true;
                    localStorage["challenge_tried_" + c.id] = true;
                    tetris.challengeFailedMessage("CHALLENGE FAILED");
                }
            }

            if (tetris.challenges.current.text == "Stay alive for 16 minutes") {
                if (tetris.getEllapsedTime() >= (60 * 14)) {
                    c.tried = true;
                    localStorage["challenge_tried_" + c.id] = true;
                    tetris.challengeFailedMessage("CHALLENGE FAILED");
                }
            }
        }


        if (tetris.appBar) {
            tetris.appBar.getCommandById("cmdShare").disabled = false;
            //tetris.appBar.getCommandById("cmdChallenges").disabled = false;

            tetris.appBar.getCommandById("cmdPause").disabled = true;
            tetris.appBar.getCommandById("cmdPlay").disabled = false;

            tetris.appBar.show();
        }

        //tetris.appBar

        if (tetris.score > tetris.best_score_player) {
            tetris.best_score_player = tetris.score;
            localStorage.setItem('best_score_player', tetris.best_score_player);
            tetris.best_zone.innerHTML = tetris.best_score_player;
            tetris.best_zone.style.color = "#423267";
        }

        var html = '<h2>GAME OVER</h2>';
        html += '<div class="overview">';
        html += '<div class="points"><div class="nb_points">' + tetris.score + '</div> points</div>';
        html += '<div class="lines"><div class="nb_lines">' + tetris.lines + '</div> lines</div>';
        html += '</div>';

        tetris.overlay.innerHTML = html;

        tetris.overlay.style.display = 'block';

        //try {


        //    var tileContent = NotificationsExtensions.TileContent.TileContentFactory.createTileSquare310x310Text09();
        //    tileContent.textHeadingWrap.text = "Best score: " + tetris.best_score_player;

        //    // Create a notification for the Wide310x150 tile using one of the available templates for the size.
        //    var wide310x150Content = NotificationsExtensions.TileContent.TileContentFactory.createTileWide310x150Text03();
        //    wide310x150Content.textHeadingWrap.text = "Best score: " + tetris.best_score_player;

        //    // Create a notification for the Square150x150 tile using one of the available templates for the size.
        //    var square150x150Content = NotificationsExtensions.TileContent.TileContentFactory.createTileSquare150x150Text04();
        //    square150x150Content.textBodyWrap.text = "Best score: " + tetris.best_score_player;

        //    // Attach the Square150x150 template to the Wide310x150 template.
        //    wide310x150Content.square150x150Content = square150x150Content;

        //    // Attach the Wide310x150 template to the Square310x310 template.
        //    tileContent.wide310x150Content = wide310x150Content;

        //    // Send the notification to the application’s tile.
        //    Windows.UI.Notifications.TileUpdateManager.createTileUpdaterForApplication().update(tileContent.createNotification());

        //} catch (ex) { }


        var dontAskKey = "dontAsk";

        if (fb.player)
            dontAskKey += "_" + fb.player.id;

        var dontAsk = new Boolean(localStorage[dontAskKey]);

        if (!Internet.isConnected()) {

            window.onDialogOpen = true;
            var alertBox = (new Windows.UI.Popups.MessageDialog("Connect to the Internet to save your score on the Global Ranking.", "Network Disconnected"));
            alertBox.showAsync().done(function () {
                window.onDialogOpen = false;
                //tetris.displayScore();
            });

        } else {

            if (fb.player == null && dontAsk == false) {
                var alertBox = (new Windows.UI.Popups.MessageDialog("Hit 'Okay'.", "Great job! Let's save your score?"));

                alertBox.commands.append(new Windows.UI.Popups.UICommand("Okay", null, 1));
                alertBox.commands.append(new Windows.UI.Popups.UICommand("Next time", null, 2));
                alertBox.commands.append(new Windows.UI.Popups.UICommand("Don't ask me again", null, 3));

                alertBox.defaultCommandIndex = 0;
                alertBox.cancelCommandIndex = 1;

                window.onDialogOpen = true;

                return alertBox.showAsync().then(function (command) {
                    if (command) {
                        window.onDialogOpen = false;
                        if (command.id == 1) {
                            tetris.publishStatus(function () {
                                tetris.displayScore();
                            });
                            return true;
                        }
                        else if (command.id == 2) {
                            tetris.displayScore();
                            return false;
                        }
                        else if (command.id == 3) {
                            tetris.displayScore();
                            localStorage[dontAskKey] = true;
                            return false;
                        }
                    }
                });
            }

        }


    },

    fall_block: function (shake) {
        if (tetris.test_position(tetris.block, tetris.block_pos, tetris.block_x, tetris.block_y + 1)) {
            // in the air : move the block down

            if (!tetris.holding) {

                tetris.stationary = false;
                tetris.block_y++;
                tetris.update_block();

                if (tetris.max_speed_mode) {
                    tetris.score += 1;
                    tetris.challenge_score += 1;
                    tetris.score_zone.innerHTML = tetris.score;
                    if (tetris.score > tetris.best_score_player) {
                        tetris.best_score_player = tetris.score;
                        localStorage.setItem('best_score_player', tetris.best_score_player);
                        tetris.best_zone.innerHTML = tetris.best_score_player;
                        tetris.best_zone.style.color = "#423267";
                    }
                };

            }

            tetris.fall_timeout = setTimeout(function () {
                tetris.fall_block(shake);
            }, tetris.max_speed_mode ? tetris.max_speed : tetris.speed);

        } else {
            // on the ground
            if (tetris.stationary) {
                // lock the block
                if (shake)
                    tetris.shake();

                tetris.lock_block();
            } else {
                // moving : lock delay
                tetris.stationary = true;
                tetris.fall_timeout = setTimeout(function () {
                    tetris.fall_block();
                }, 300);
            }
        };
    },

    test_position: function (block, pos, x, y) {
        var allowed = true;
        for (var i = 0; i < tetris.shape[block][pos].length; i++) {
            if (allowed) {
                for (var j = 0; j < tetris.shape[block][pos][0].length; j++) {
                    // for each block of the new pos ...
                    if (tetris.shape[block][pos][i][j] == 1) {
                        // ... check if there is room to move
                        if (x + j < 0 || x + j >= tetris.cols || y + i >= tetris.rows) {
                            // off the wall
                            allowed = false;
                            break;
                        } else {
                            if (y + i >= 0) {
                                if (tetris.board[y + i][x + j].stone) {
                                    // block already exists there
                                    allowed = false;
                                    break;
                                };
                            };
                        };
                    };
                };
            };
        };
        return allowed;
    },

    ColorLuminance: function (hex, lum) {

        if (Math.abs(lum) > 1)
            lum = Math.round((lum % 1) * 100) / 100;

        // validate hex string
        hex = String(hex).replace(/[^0-9a-f]/gi, '');

        if (hex.length < 6) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        lum = lum || 0;

        // convert to decimal and change luminosity
        var rgb = "#", c, i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i * 2, 2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ("00" + c).substr(c.length);
        }

        return rgb;
    },

    update_block: function () {
        // erase the previous block
        for (var i = 0; i < tetris.rows; i++) {
            for (var j = 0; j < tetris.cols; j++) {
                if (tetris.board[i][j].block || tetris.board[i][j].shadow) {
                    tetris.board[i][j].block = false;
                    tetris.board[i][j].shadow = false;
                    tetris.board[i][j].updated = true;
                }
            };
        };
        // draw the new position of the block
        for (var i = 0; i < tetris.shape[tetris.block][tetris.block_pos].length; i++) {
            for (var j = 0; j < tetris.shape[tetris.block][tetris.block_pos][0].length; j++) {
                if (tetris.shape[tetris.block][tetris.block_pos][i][j] == 1) {
                    if (tetris.block_y + i >= 0) {
                        tetris.board[tetris.block_y + i][tetris.block_x + j].block = true;
                        tetris.board[tetris.block_y + i][tetris.block_x + j].color = tetris.ColorLuminance(tetris.colors[tetris.block], (tetris.level / 10) * -1);
                        tetris.board[tetris.block_y + i][tetris.block_x + j].updated = true;
                    }
                }
            };
        };
        // cast shadow
        var kick_y = 0;
        while (tetris.test_position(tetris.block, tetris.block_pos, tetris.block_x, tetris.block_y + kick_y)) {
            kick_y++;
        }
        for (var i = 0; i < tetris.shape[tetris.block][tetris.block_pos].length; i++) {
            for (var j = 0; j < tetris.shape[tetris.block][tetris.block_pos][0].length; j++) {
                if (tetris.shape[tetris.block][tetris.block_pos][i][j] == 1) {
                    if (tetris.block_y + i + (kick_y - 1) >= 0) {
                        if (tetris.board[tetris.block_y + i + (kick_y - 1)][tetris.block_x + j].stone == false) {
                            tetris.board[tetris.block_y + i + (kick_y - 1)][tetris.block_x + j].shadow = true;
                            tetris.board[tetris.block_y + i + (kick_y - 1)][tetris.block_x + j].color = tetris.ColorLuminance(tetris.colors[tetris.block], (tetris.level / 10) * -1);
                            tetris.board[tetris.block_y + i + (kick_y - 1)][tetris.block_x + j].updated = true;
                        };
                    };
                };
            };
        };
        tetris.show_block();
    },

    show_stone: function () {


        for (var i = 1; i < tetris.rows; i++) {
            for (var j = 0; j < tetris.cols; j++) {
                if (tetris.board[i][j].color != null) {
                    tetris.display_stone[i][j].children[0].setFill(tetris.board[i][j].color);
                };
                if (tetris.board[i][j].stone) {
                    tetris.display_stone[i][j].show();
                } else {
                    tetris.display_stone[i][j].hide();
                };
            };
        };


        // fix for Android 4.1
        /*
        var canvas = document.querySelectorAll('#game_zone canvas');
        canvas[0].width = tetris.block_width * tetris.cols;
        canvas[0].height = tetris.block_width * (tetris.rows - 1);
        canvas[1].width = tetris.block_width * tetris.cols;
        canvas[1].height = tetris.block_width * (tetris.rows - 1);
        canvas[2].width = tetris.block_width * tetris.cols;
        canvas[2].height = tetris.block_width * (tetris.rows - 1);
        */

        tetris.layer_stone.draw();

    },

    show_block: function () {
        for (var i = 1; i < tetris.rows; i++) {
            for (var j = 0; j < tetris.cols; j++) {

                if (tetris.board[i][j].updated) {

                    if (tetris.board[i][j].block) {

                        tetris.display_block[i][j].children[0].setFill(tetris.board[i][j].color);

                        tetris.display_block[i][j].show();


                    } else {
                        tetris.display_block[i][j].hide();
                    };

                    if (tetris.board[i][j].shadow) {

                        //tetris.display_shadow[i][j].setFill(tetris.board[i][j].color);

                        tetris.display_shadow[i][j].setFill('white'); //change color of shadow

                        tetris.display_shadow[i][j].show();


                    } else {
                        tetris.display_shadow[i][j].hide();
                    };
                    tetris.board[i][j].updated = false;
                };
            };
        };

        // fix for Android 4.1
        /*
        var canvas = document.querySelectorAll('#game_zone canvas');
        canvas[0].width = tetris.block_width * tetris.cols;
        canvas[0].height = tetris.block_width * (tetris.rows - 1);
        canvas[1].width = tetris.block_width * tetris.cols;
        canvas[1].height = tetris.block_width * (tetris.rows - 1);
        canvas[2].width = tetris.block_width * tetris.cols;
        canvas[2].height = tetris.block_width * (tetris.rows - 1);
        */

        tetris.layer_shadow.draw();
        tetris.layer_block.draw();

    },

    show_next: function () {
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                tetris.display_next[i][j].hide();
            };
        };
        for (var i = 0; i < tetris.shape[tetris.next_block][tetris.next_block_pos].length; i++) {
            for (var j = 0; j < tetris.shape[tetris.next_block][tetris.next_block_pos][0].length; j++) {
                if (tetris.shape[tetris.next_block][tetris.next_block_pos][i][j] == 1) {

                    tetris.display_next[i][j].children[0].setFill(tetris.ColorLuminance(tetris.colors[tetris.next_block], (tetris.level / 10) * -1));

                    tetris.display_next[i][j].show();
                }
            };
        };
        switch (tetris.next_block) {
            case 0:
                tetris.next_layer.setX(0);
                tetris.next_layer.setY(0);
                break;
            case 1:
                tetris.next_layer.setX(tetris.block_width);
                tetris.next_layer.setY(tetris.block_width);
                break;
            default:
                tetris.next_layer.setX(tetris.block_width / 2);
                tetris.next_layer.setY(tetris.block_width / 2);
                break;
        }
        // fix for Android 4.1
        /*
        var canvas = document.querySelectorAll('#next_zone canvas');
        canvas[0].width = tetris.block_width * 4;
        canvas[0].height = tetris.block_width * 4;
        */

        tetris.next_layer.draw();
    },

    stageupSoundIndex: 0,
    clearSoundIndex: 0,
    cleargoodSoundIndex: 0,

    playSound: function (action) {

        if (tetris.mutedFx)
            return;

        switch (action) {

            case "rotate":
                document.getElementById('rotate').play();
                break;

            case "clear1":
                if (tetris.clearSoundIndex > 15)
                    tetris.clearSoundIndex = 0;
                else
                    tetris.clearSoundIndex++;
                try {
                    document.getElementById('clear_' + tetris.clearSoundIndex).play();
                } catch (ex) {
                    tetris.clearSoundIndex = 0;
                    document.getElementById('clear_' + tetris.clearSoundIndex).play();
                }
                break;

            case "stageup":
                if (tetris.stageupSoundIndex > 4)
                    tetris.stageupSoundIndex = 0;
                else
                    tetris.stageupSoundIndex++;
                try {
                    document.getElementById('stageup_' + tetris.stageupSoundIndex).play();
                } catch (ex) {
                    tetris.stageupSoundIndex = 0;
                    document.getElementById('stageup_' + tetris.stageupSoundIndex).play();
                }
                break;

            case "clear2":
                if (tetris.clearSoundIndex > 15)
                    tetris.clearSoundIndex = 0;
                else
                    tetris.clearSoundIndex++;
                try {
                    document.getElementById('clear_' + tetris.clearSoundIndex).play();
                } catch (ex) {
                    tetris.clearSoundIndex = 0;
                    document.getElementById('clear_' + tetris.clearSoundIndex).play();
                }
                break;

            case "clear3":
                if (tetris.clearSoundIndex > 15)
                    tetris.clearSoundIndex = 0;
                else
                    tetris.clearSoundIndex++;
                try {
                    document.getElementById('clear_' + tetris.clearSoundIndex).play();
                } catch (ex) {
                    tetris.clearSoundIndex = 0;
                    document.getElementById('clear_' + tetris.clearSoundIndex).play();
                }
                break;

            case "clear4":
                if (tetris.cleargoodSoundIndex > 4)
                    tetris.cleargoodSoundIndex = 0;
                else
                    tetris.cleargoodSoundIndex++;
                try {
                    document.getElementById('cleargood_' + tetris.cleargoodSoundIndex).play();
                } catch (ex) {
                    tetris.cleargoodSoundIndex = 0;
                    document.getElementById('cleargood_' + tetris.cleargoodSoundIndex).play();
                }
                break;

            case "beep":
                document.getElementById('beep').play();
                break;

            case "drop":
                document.getElementById('drop').play();
                break;

            case "shake":
                document.getElementById('shake').play();
                break;

            case "touch":
                document.getElementById('touch').play();
                break;

            case "challenge_done":
                document.getElementById('challenge_done').play();
                break;

        }
    },

    shake: function () {
        tetris.layer_stone.setY(tetris.block_width / 16);
        setTimeout(function () {
            tetris.layer_stone.setY(0);
        }, 50);

        tetris.count_drops[tetris.level] += 1;
        tetris.challenge_count_drops += 1;
        tetris.playSound("drop");
    },

    shine: function () {

        for (var k = 0; k < tetris.shine_tab.length; k++) {
            if (tetris.shine_tab[k].i > 0) {

                tetris.display_stone[tetris.shine_tab[k].i][tetris.shine_tab[k].j].children[1].setFill('rgba(255, 255, 255, .6)');
                tetris.display_stone[tetris.shine_tab[k].i][tetris.shine_tab[k].j].children[2].setFill('rgba(0, 0, 0, .6)');

            };
        };

        setTimeout(function () {
            for (var k = 0; k < tetris.shine_tab.length; k++) {
                if (tetris.shine_tab[k].i > 0) {

                    tetris.display_stone[tetris.shine_tab[k].i][tetris.shine_tab[k].j].children[1].setFill('rgba(255, 255, 255, .3)');
                    tetris.display_stone[tetris.shine_tab[k].i][tetris.shine_tab[k].j].children[2].setFill('rgba(0, 0, 0, .3)');

                };
            }

            tetris.shine_tab = [];
            tetris.layer_stone.draw();
        }, 100);

    },

    lit_line: function (line) {

        tetris.display_line[line].show();
        tetris.layer_block.draw();

        setTimeout(function () {
            tetris.display_line[line].hide();
            tetris.layer_block.draw();
        }, 100);

        setTimeout(function () {
            tetris.display_line[line].show();
            tetris.layer_block.draw();
        }, 200);

        setTimeout(function () {
            tetris.display_line[line].hide();
            tetris.layer_block.draw();
        }, 300);

    },

    message: function (texte) {
        tetris.messages.innerHTML = texte;
        setTimeout(function () {
            tetris.messages.innerHTML = '';
        }, 500);
    },

    challengeFailedMessage: function (texte) {
        tetris.messages.innerHTML = "<span class='font_failed_challenge'>" + texte + "</span>";
        setTimeout(function () {
            tetris.messages.innerHTML = '';
        }, 1750);
    },

    challengeMessage: function (texte, color) {
        color = "gold";
        tetris.playSound("challenge_done");
        tetris.messages.innerHTML = "<span class='font_" + color + "'>" + texte + "</span>";
        setTimeout(function () {
            tetris.messages.innerHTML = '';
        }, 1250);
    },

    move_left: function () {
        if (tetris.test_position(tetris.block, tetris.block_pos, tetris.block_x - 1, tetris.block_y)) {
            tetris.block_x--;
            tetris.stationary = false;
            tetris.update_block();
        };
    },

    move_right: function () {
        if (tetris.test_position(tetris.block, tetris.block_pos, tetris.block_x + 1, tetris.block_y)) {
            tetris.block_x++;
            tetris.stationary = false;
            tetris.update_block();
        };
    },

    drop_block: function () {
        var kick_y = 0;
        while (tetris.test_position(tetris.block, tetris.block_pos, tetris.block_x, tetris.block_y + kick_y)) {
            kick_y++;
        }
        tetris.block_y += kick_y - 1;
        tetris.score += kick_y - 1;
        tetris.challenge_score += kick_y - 1;

        tetris.score_zone.innerHTML = tetris.score;
        if (tetris.score > tetris.best_score_player) {
            tetris.best_score_player = tetris.score;
            localStorage.setItem('best_score_player', tetris.best_score_player);
            tetris.best_zone.innerHTML = tetris.best_score_player;
            tetris.best_zone.style.color = "#423267";
        }

        tetris.update_block();
        tetris.shake();
        tetris.lock_block();
    },

    rotate_block: function () {
        // try the new position
        var kick_x = 0;
        var kick_y = 0;
        var new_pos = tetris.block_pos + 1;
        if (new_pos >= tetris.shape[tetris.block].length) {
            new_pos = 0;
        };
        var allowed = true;
        allowed = tetris.test_position(tetris.block, new_pos, tetris.block_x, tetris.block_y);

        if (!allowed) {
            // try a wall kick on the left
            if (tetris.test_position(tetris.block, new_pos, tetris.block_x - 1, tetris.block_y)) {
                allowed = true;
                kick_x = -1;
            };
        }
        if (!allowed) {
            // try a wall kick on the right
            if (tetris.test_position(tetris.block, new_pos, tetris.block_x + 1, tetris.block_y)) {
                allowed = true;
                kick_x = 1;
            };
        }
        if (!allowed) {
            // try a wall kick on the top
            if (tetris.test_position(tetris.block, new_pos, tetris.block_x, tetris.block_y - 1)) {
                allowed = true;
                kick_y = -1;
            };
        }
        if (!allowed) {
            // try a double wall kick on the left
            if (tetris.test_position(tetris.block, new_pos, tetris.block_x - 2, tetris.block_y)) {
                allowed = true;
                kick_x = -2;
            };
        }
        if (!allowed) {
            // try a double wall kick on the right
            if (tetris.test_position(tetris.block, new_pos, tetris.block_x + 2, tetris.block_y)) {
                allowed = true;
                kick_x = 2;
            };
        }
        if (allowed) {
            // move the block (rotate)
            tetris.block_pos = new_pos;
            tetris.block_x += kick_x;
            tetris.block_y += kick_y;
            tetris.stationary = false;
            tetris.update_block();
            tetris.playSound("rotate");
        };
    },

    watch_keys: function () {

        document.addEventListener('keydown', function (e) {
            e.preventDefault();

            if (tetris.startingGame || tetris.state == 'pause' || tetris.stage == 'game_over' || tetris.forcedPause || tetris.calledPause)
                return;

            tetris.appBar.hide();

            if (tetris.state == 'game' && tetris.mappings[e.keyCode]) {
                e.preventDefault();
                switch (tetris.mappings[e.keyCode]) {
                    case 'left':
                        tetris.move_left();
                        tetris.press_left = true;
                        break;
                    case 'right':
                        tetris.move_right();
                        tetris.press_right = true;
                        break;
                    case 'drop':
                        if (!tetris.press_drop) {
                            tetris.drop_block();
                            tetris.press_drop = true;
                        }
                        break;
                    case 'down':
                        if (!tetris.press_down) {
                            tetris.max_speed_mode = true;
                            clearTimeout(tetris.fall_timeout);
                            tetris.stationary = true;
                            tetris.fall_block();
                            tetris.press_down = true;
                        }
                        break;
                    case 'rotate':
                        if (!tetris.press_rotate) {
                            tetris.rotate_block();
                            tetris.press_rotate = true;
                        }
                        break;
                };
            };
        });

        document.addEventListener('keyup', function (e) {
            e.preventDefault();

            //if (tetris.startingGame || tetris.state == 'pause' || tetris.stage == 'game_over' || tetris.forcedPause || tetris.calledPause)
            //    return;

            if ((tetris.state == 'game' || tetris.state == 'pause') && tetris.mappings[e.keyCode]) {
                e.preventDefault();

                if (tetris.state == 'pause' && tetris.forcedPause) {

                    try {
                        var alertBox = (new Windows.UI.Popups.MessageDialog("Do you want to resume?", tetris.name));

                        alertBox.commands.append(new Windows.UI.Popups.UICommand("Yes", null, 1));
                        alertBox.commands.append(new Windows.UI.Popups.UICommand("Cancel", null, 2));

                        alertBox.defaultCommandIndex = 0;
                        alertBox.cancelCommandIndex = 1;

                        return alertBox.showAsync().then(function (command) {
                            if (command) {
                                if (command.id == 1) {
                                    tetris.forcedPause = false;
                                    tetris.resume_game();
                                }
                                else if (command.id == 2) {
                                    return false;
                                }
                            }
                        });

                    } catch (ex) { }

                }

                switch (tetris.mappings[e.keyCode]) {
                    case 'left':
                        tetris.press_left = false;
                        break;
                    case 'right':
                        tetris.press_right = false;
                        break;
                    case 'drop':
                        tetris.press_drop = false;
                        break;
                    case 'down':
                        tetris.max_speed_mode = false;
                        tetris.press_down = false;
                        break;
                    case 'rotate':
                        tetris.press_rotate = false;
                        break;
                }
            }
        });

    },

    resize: function () {

        tetris.block_width = tetris.pageOffsetWidth() * tetris.block_width_standard;
        tetris.game_col.style.width = tetris.block_width * tetris.cols + 'px';
        tetris.game_col.style.height = tetris.block_width * (tetris.rows - 1) + 'px';
        tetris.next_zone.style.width = tetris.block_width * 4 + 'px';
        tetris.next_zone.style.height = tetris.block_width * 4 + 'px';

    },

    pageOffsetWidth: function () {

        return 500;//(tetris.page.offsetWidth - 0) / 2;

    }

};

tetris.init();