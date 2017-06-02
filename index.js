var builder = require('botbuilder');
var apiairecognizer = require('api-ai-recognizer');
var request = require('request');
var connector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(connector);
var recognizer = new apiairecognizer("6449d0ff2ed5404eaf2eee70e323e506");
var intents = new builder.IntentDialog({
    recognizers: [recognizer]
});
bot.dialog('/', intents);
intents.matches('whatIsWeather', [function (session, args) {
    var city = builder.EntityRecognizer.findEntity(args.entities, 'cities');
    if (city) {
        var city_name = city.entity;
        var url = "http://api.apixu.com/v1/current.json?key=8013d92e832740fc96f235910170106&q=" + city_name;
        request(url, function (error, response, body) {
            body = JSON.parse(body);
            temp = body.current.temp_c;
            session.send("It's " + temp + " degrees celsius in " + city_name);
        });
    } else {
        builder.Prompts.text(session, 'Which city do you want the weather for?');
    }
}, function (session, results) {
    var city_name = results.response;
    var url = "http://api.apixu.com/v1/current.json?key=8013d92e832740fc96f235910170106&q=" + city_name;
    request(url, function (error, response, body) {
        body = JSON.parse(body);
        temp = body.current.temp_c;
        session.send("It's " + temp + " degrees celsius in " + city_name);
    });
}]);
