Helper = (function () {


    function hasClass(element, selector) {
        if (!element.className)
            return false;

        var className = " " + selector + " ";

        if ((" " + element.className + " ").replace(/[\t\r\n\f]/g, " ").indexOf(className) >= 0)
            return true;

        return false;
    };

    function addClass(elem, value) {
        var classes, cur, clazz, j, i = 0,
            proceed = typeof value === "string" && value;

        if (proceed) {
            classes = (value || "").match(/\S+/g) || [];

            cur = (elem.className ? (" " + elem.className + " ").replace(/[\t\r\n\f]/g, " ") : " ");

            if (cur) {
                j = 0;
                while ((clazz = classes[j++])) {
                    if (cur.indexOf(" " + clazz + " ") < 0) {
                        cur += clazz + " ";
                    }
                }
                elem.className = cur.trim();
            }
        }

        return this;
    };

    function removeClass(elem, value) {
        var classes, cur, clazz, j, i = 0,
            proceed = arguments.length === 0 || typeof value === "string" && value;

        if (proceed) {
            classes = (value || "").match(/\S+/g) || [];

            cur = (elem.className ? (" " + elem.className + " ").replace(/[\t\r\n\f]/g, " ") : "");

            if (cur) {
                j = 0;
                while ((clazz = classes[j++])) {
                    while (cur.indexOf(" " + clazz + " ") >= 0) {
                        cur = cur.replace(" " + clazz + " ", " ");
                    }
                }
                elem.className = value ? cur.trim() : "";
            }
        }

        return this;
    };

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

    function clone(obj) {
        var target = {};
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                target[i] = obj[i];
            }
        }
        return target;
    };

    function incrementalArray(start, end, step) {
        var prec = ("" + step).length - ("" + step).indexOf(".") - 1;
        var arr = [];

        var count = +((end - start) / step).toFixed();
        for (var j = 0; j <= count; j++) {
            var i = start + +(j * step).toFixed(prec);
            arr.push(i);
        }
        return arr;
    };

    function ellapsedTimeText(totalSeconds) {
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = totalSeconds - (minutes * 60);

        return minutes + ":" + ((seconds <= 9) ? "0" + seconds : seconds);
    };

    function ellapsedTimeTextTrim(totalSeconds) {
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = totalSeconds - (minutes * 60);

        if (minutes == 0)
            return seconds;

        return minutes + ":" + ((seconds <= 9) ? "0" + seconds : seconds);
    };

    return {
        hasClass: hasClass,
        addClass: addClass,
        removeClass: removeClass,
        extractQuerystring: extractQuerystring,
        incrementalArray: incrementalArray,
        ellapsedTimeText: ellapsedTimeText,
        ellapsedTimeTextTrim: ellapsedTimeTextTrim,
        clone: clone
    };

})();