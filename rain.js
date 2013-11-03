$.ajax('http://api.wurstmineberg.de/server/level.json', {
    dataType: 'json',
    success: function(data) {
        var rainstatus = -1
        if ('Data' in data) {
            if ('raining' in data['Data']) {
                rainstatus = data['Data']['raining']
            }
        }

        if (rainstatus == -1) {
            $('#rain-caption').text("???")
            $('#rain-text').text("I have no idea. Seriously. Something is broken")
        } else if (rainstatus == 0) {
            $('#rain-caption').text("No!")
            $('#rain-text').text("It's not raining.")
        } else {
            $('#rain-caption').text("Yes!")
            $('#rain-text').text("It's raining!")
        } 
    }
});
