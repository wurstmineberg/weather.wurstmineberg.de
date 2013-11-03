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
            $('#rain-text').text("It's not raining, you can come out now.")
            $('#image').text("<img src='http://hydra-media.cursecdn.com/minecraft.gamepedia.com/6/61/Sun.png' class='img-rounded'>")
        } else {
            $('#rain-caption').text("Yes! D:")
            $('#rain-text').text("It's raining! Grab yo' helmets, hide yo' snowmen!")
            $('#image').text("<img src='http://i.imgur.com/TP4OGpU.png' class='img-rounded'>")

        } 
    }
});