var rainstatus = -2;
var thunderstatus = -2;
var rainTime = -2;
var thunderTime = -2;

var thunderMinTicks = 3600;
var thunderMaxTicks = 12000 + thunderMinTicks;
var thunderMinWaitTicks = 12000;

var rainMinTicks = 12000;
var rainMaxTicks = 12000 + rainMinTicks
var rainMinWaitTicks = 12000;

var updating = true;
var refreshingData = true;

var previousTimestamp = 0;

if (!/^isitraining\.(dev\.)?([0-9a-z]+\.)?wurstmineberg\.de$/.test(location.hostname)) {
    $('#isitraining-caption').html('Is it raining on Wurstmineberg?');
}
setInterval(refreshTimer, 30000);
setInterval(tickTimer, 50);
fetchData();

function padNumber(num, size) {
    var s = num + '';
    while (s.length < size) s = "0" + s;
    return s;
}

function ticks_to_text(ticks)
{
    var seconds = Math.floor(ticks / 20);
    var secondsSinceHour = seconds % 50;
    var hours = Math.floor(seconds / 50);
    var hoursSinceDay = hours % 24;
    var days = Math.floor(hours / 24);
    var daysSinceMonth = days % 8;
    var months = Math.floor(days / 8);
    var monthsSinceYear = months % 9 ;
    var years = Math.floor(months / 9);
    
    var text = padNumber(secondsSinceHour, 2) + 's';

    if (hours > 0) {
        text = hoursSinceDay + 'h ' + text;
    };
    if (days > 0) {
        text = daysSinceMonth + 'd ' + text;
    };
    if (months > 0) {
        text = monthsSinceYear + 'm ' + text;
    };
    if (years > 0) {
        text = years + 'y ' + text;
    };

    return text;
}

function tickTimer() {
    if (!updating) {
        // The thunder status is known and it will now start thundering
        if (thunderTime <= 0) {
            if (thunderTime != -2) {
                // Thunder status is unknown until next refresh
                thunderTime = -2;
            };
        } else {
            thunderTime--;
            if (thunderTime <= 0) {
                thunderstatus = thunderstatus == 1 ? 0 : 1;
            };
        };

        // The rain status is known and it will now start thundering
        if (rainTime <= 0) {
            if (rainTime != -2) {
                // Rain status is unknown until next refresh
                rainTime = -2;
            };
        } else {
            rainTime--;
            if (rainTime <= 0) {
                rainstatus = rainstatus == 1 ? 0 : 1;
            };
        };

        displayWeatherStatus();
    };
}

function refreshTimer() {
    if (!refreshingData) {
        fetchData();
    };
}

function displayWeatherStatus() {
    // Ok here is how it works. I looked at the source code!
    // The only rain toggle is rainTime.
    // When thunderTime gets to zero, it resets normally.
    // Only when it also rains WHILE it is thundering, an actual thunderstorm is going on.
    // When currently thundering it will stop when either thunderTime or rainTime gets to zero

    var rainToggleTimeText = '';

    if (rainstatus < 0) {
        $('#rain-caption').text("???");
        $('#rain-text').text("I have no idea. Seriously. Something is broken");
    } else if (rainstatus == 0) {
        $('#rain-caption').text("No!");
        $('#rain-text').text("It's not raining, you can come out now.");
        $('#wimg').attr('src', '/img/sun.png');

        var minRainTimestamp = rainTime + rainMinTicks;
        var maxRainTimestamp = rainTime + rainMaxTicks;

        var minThunderTimestamp = thunderTime + thunderMinTicks;
        var maxThunderTimestamp = thunderTime + thunderMaxTicks;

        if (rainTime >= 0) {
            if ((thunderstatus == 1 && thunderTime > rainTime) ||
                (thunderTime < rainTime && thunderTime + thunderMinTicks > rainTime)) {
                var timeText = ticks_to_text(rainTime);
                $('#forecast-text').text("Weather forecast: WEATHER ALERT: There will be a (possibly short) thunderstorm in " + timeText + "!");
            } else if (thunderstatus == 0 && thunderTime >= rainTime && thunderTime < maxRainTimestamp) {
                if (thunderTime < rainTime + rainMinTicks) {
                    // Not thundering, not raining, but after the minimal time of rain it will have started to thunder.
                    var rainText = ticks_to_text(rainTime);
                    var thunderText = ticks_to_text(thunderTime);
                    $('#forecast-text').text("Weather forecast: It will be raining in " + rainText + ". ALERT: There will also be a thunderstorm in " + thunderText + "!");
                } else {
                    // Probability that thunder will have started while rain is still going on.
                    var thunderTimeAfterRainMinTime = thunderTime - minRainTimestamp;
                    var thunderProbability = 1 - (thunderTimeAfterRainMinTime / (rainMaxTicks - rainMinTicks));
                    var timeText = ticks_to_text(rainTime);
                    $('#forecast-text').text("Weather forecast: It will be raining in " + timeText + " with a " + Math.floor(thunderProbability * 100) +  "% chance of a thunderstorm!");
                }
            } else {
                 var timeText = ticks_to_text(rainTime);
                 $('#forecast-text').text("Weather forecast: It will be raining in " + timeText + ".");
            };
        };
    } else if (thunderstatus == 1) {
        $('#rain-caption').text("Yes! D:");
        $('#rain-text').text("It's thundering even! Ermagehrd!");
        $('#wimg').attr('src', '/img/thunder.png');

        if (thunderTime >= 0 && rainTime >= 0) {
            if (thunderTime < rainTime) {
                var timeText = ticks_to_text(thunderTime);
                $('#forecast-text').text("Weather forecast: It will stop thundering in " + timeText + ". Afterwards it will be raining.");
            } else {
                var timeText = ticks_to_text(rainTime);
                $('#forecast-text').text("Weather forecast: There will be sunshine in " + timeText + ".");
            };
        };
    } else {
        $('#rain-caption').text("Yes! D:");
        $('#rain-text').text("It's raining! Grab yo' helmets, hide yo' snowmen!");
        $('#wimg').attr('src', '/img/rain.png');

        if (thunderTime >= 0 && rainTime >= 0) {
            if (thunderTime < rainTime) {
                var timeText = ticks_to_text(thunderTime);
                $('#forecast-text').text("Weather forecast: WEATHER ALERT: There will be a thunderstorm in " + timeText + "!");
            } else {
                var timeText = ticks_to_text(rainTime);
                $('#forecast-text').text("Weather forecast: There will be sunshine in " + timeText + ".");
            };
        };
    };
}

function fetchData() {
    $.ajax('//api.wurstmineberg.de/server/level.json', {
        dataType: 'json',
        success: function(data) {
            updating = true;
            var tickOffset;

            if ('Data' in data) {
                if ('raining' in data['Data']) {
                    rainstatus = data['Data']['raining']
                };

                if ('thundering' in data['Data']) {
                    thunderstatus = data['Data']['thundering']
                };

                if ('rainTime' in data['Data']) {
                    rainTime = data['Data']['rainTime'];
                };

                if ('thunderTime' in data['Data']) {
                    thunderTime = data['Data']['thunderTime'];
                };
            };

            if ('api-time-last-modified' in data &&
                'api-time-result-fetched' in data) {
                var secondOffset = data['api-time-result-fetched'] - data['api-time-last-modified'];
                tickOffset = secondOffset * 20;

                if (Math.floor(previousTimestamp) == Math.floor(data['api-time-last-modified'])) {
                    // No update so we don't need to update the data and replace it
                    updating = false;
                    refreshingData = false;
                    return;
                };

                previousTimestamp = data['api-time-last-modified'];
            };

            thunderTime -= tickOffset;
            rainTime -= tickOffset;

            if (thunderTime <= 0) {
                thunderTime = -2;
                thunderstatus = thunderstatus == 1 ? 0 : 1;
            };

            if (rainTime <= 0) {
                rainTime = -2;
                rainstatus = rainstatus == 1 ? 0 : 1;
            };

            updating = false;
            refreshingData = false;
            displayWeatherStatus();
        }
    });
};
