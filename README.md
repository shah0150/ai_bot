# API AI Bot using Microsoft Bot Framework

Unless you have been living in a cave with no internet access, you must have heard about how chatbots are the next biggest thing and how they will completely replace apps. The jury is still out on whether that’s true.

But we can’t ignore the fact that all major companies have been betting on this new field. Facebook, Microsoft, Google, Amazon are all in on the craze.

Microsoft’s offering ‘Microsoft Bot Framework’ is the most interesting offering according to me. It lets you easily build bots for multiple platforms like

* Facebook Messenger
* Slack
* Telegram
* WeChat
* Kik
* SMS (twilio)
* Email
* Skype
* Skype Teams

You can write code either in node.js or C#. The best thing however about the framework is how easy it makes to maintain and store data through multiple databags like SessionData, UserData and ConversationData.

Natural Language Processing is a very critical piece for building amazing chatbots. Microsoft Bot Framework lets you easily do this by providing built-in support for luis.ai (part of microsoft cognitive services offering for language processing). However not everyone might want to use LUIS as it requires you to have an azure subscription (starting dec 31).

So I used a small npm module api-ai-recognizer to use api.ai instead of LUIS with microsoft bot framework. In this tutorial we will see how you can build a simple weather bot using api.ai and Microsoft Bot Framework.


## Tutorial 

We will be using node.js for building the bot and then deploy it to Microsoft Bot Framework Service. You can then deploy it to a channel of your choice.

## Set up Environment

Make sure you have node.js and npm installed.

The first thing we have to do is create a directory so lets go ahead and create a directory in Desktop called weather-bot. Now cd into the directory.

```
mkdrir weather-bot
```
```
cd weather-bot
```
Initialize npm so we can download the required packages. Run the following command and accept all the defualt options.

```
npm init
```

Verify that npm has been initialized by checking if a file called package.json has been created. Once you have verified that lets install the required packages.

To start off we only need two packages

* botbuilder — For using microsoft bot builder 
* api-ai-recognizer — For using api.ai for NLP

Let’s go ahead and install both packages by running the following command

```
npm install --save botbuilder api-ai-recognizer
```
# Create a baisc echo bot

So in this step we will create a very basic bot that will just echo what we say. It’s pretty dumb but it’s a start and in the next steps we will build on top of it.

Once the npm packages have installed, create a file called index.js in the root directory and paste in the following code

```JavaScript
var builder = require('botbuilder');
var connector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(connector);
bot.dialog('/', function (session) {
    session.send("You said %s", session.message.text);
});
```
You can test the bot by starting the node server and directly chatting on the console.

```
node index.js
```
Type in Hi and you shall get the response of You said Hi

# Create natural understanding model

In this step we will be building a natural language processing model on api.ai so that our bot will be able to understand human language queries like

What’s the weather in Ottawa tomorrow?

The first thing is to head to api.ai and create an account.

Next create an agent called weather-bot by filling in the required details

[[image]]

The next step is to create an intent. An intent is basically a way to figure out what the intended action is for a given natural language text.

So let’s create a intent called whatIsWeather to classify all queries where a user wants to find out the weather. (It’s not neccessary to name your intents without spaces. It’s just a convention I like to follow.)

Give the following example: 

* What is the weather?
* What’s weather like now?
* How is the climate?
* How’s the weather?

In a real application you would provide more examples but for the purposes of this demo these should do good.

You can give it a response if you want but we won’t really be using it in this demo.

Once you have created the intent you can save it and check if it’s working by using the try it now chat section on the right side of the website. You should be able to see that the intent gets recognized.

# Connect api.ai with Microsoft Bot Framework 

This is the step where the magic happens. But before we connect api.ai to our code we need to grab the client token. To do this just click on the agent dropdown and select view all agents.

Select the weather-bot agent from the list of agents and you should be able to find your client access token there

![Token API.AI](http://shah0150.edumedia.ca/Azure/token.png )

Now change index.js as the following code to make the connection

```JavaScript
var builder = require('botbuilder');
var apiairecognizer = require('api-ai-recognizer');
var connector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(connector);
var recognizer = new apiairecognizer( < api.ai token > );
var intents = new builder.IntentDialog({
    recognizers: [recognizer]
});
bot.dialog('/', function (session) {
    session.send("You said %s", session.message.text);
});
```
Note: Don’t forget to put in your client token

This code basically creates an intent recognizer which will try to recognize any incoming text based on our api.ai model.

Now lets use it. Replace your previous bot.dialog code with the one below

```JavaScript
bot.dialog('/', intents);
intents.onDefault(function (session) {
    session.send("Sorry...can you please rephrase?");
});
```
Basically what we are doing above is pass all the messages to the api.ai intent recognizer and then setting up a default handler. This is where you put your infamous “Sorry..I couldn’t understand” type of messages.

Once having added this code, try to run it. It should give the default response to anything you say, because we only specified the default case.

Let’s add the handler to recognize the whatIsWeather intent we created earlier.

```JavaScript
bot.dialog('/', intents);
intents.matches('whatIsWeather', function (session) {
    session.send("It's 27 degrees celsius");
});
intents.onDefault(function (session) {
    session.send("Sorry...can you please rephrase?");
});

```

We have hardcoded the response right now but we will hook it up to an API later.

If we run the app now, it should be able to recognize the statements which are similar to the ones we trained the intent with before.

```
node index.js
```
```
whats the weather 
It's 27 degrees celsius 
```
```
Hi 
Sorry...can you please rephrase?
```
Even though the bot just says 27 degrees all the time we have made some progress. We have a functional bot.

# Get Weather Data from API

In this step we will be getting the real weather data from the APIXU current weather api.

The API will require one parameter, the city name whose current weather data we will need.

We will get these parameter out of the user’s query and if he doesn’t provide it, we will explicitly ask the user to provide a city name.

These parameters in NLP terms are called entities and we will have to train our api.ai models to understand and extract these entities. So lets do that.

Click on entities in the left menu and select create new entity and create a new entity called cities and put in some example city names.

In a real world scenario you would be using pre-built entities which have already been trained with a lot of examples. But we will make do with this for the purposes of this bot. Don’t forget to click on the save button once you are done adding examples.

Now lets train api.ai to understand the cities entity. Go back to intents and click on whatIsWeather intent. Let’s add a few examples which have city name in the sentence.

Something like

```
What's the weather in Ottawa?

```
The entity should be auto detected. Make sure its your entity and not a prebuilt entities. Prebuilt entity names have the format sys.name. Add a few examples and then save the intent.

![API AI](http://shah0150.edumedia.ca/Azure/API_AI.png)

Now lets add some code to pull out the entity information from the phrase. It will be very similar to the fulfillments code.

```JavaScript
intents.matches('whatIsWeather', function (session, args) {
    var city = builder.EntityRecognizer.findEntity(args.entities, 'cities');
    if (city) {
        var city_name = city.entity;
        session.send("It's 27 degrees celsius in " + city_name);
    } else {
        session.send("It's 27 degrees celsius");
    }
});
```
We however have to still handle the case where city is not given. We can do this by issuing a prompt to user asking him for a city name. Here’s the code to do that

```JavaScript
intents.matches('whatIsWeather', [function (session, args) {
    var city = builder.EntityRecognizer.findEntity(args.entities, 'cities');
    if (city) {
        var city_name = city.entity;
        session.send("It's 27 degrees celsius in " + city_name);
    } else {
        builder.Prompts.text(session, 'Which city do you want the weather for?');
    }
}, function (session, results) {
    session.send("It's 27 degrees celsius in " + results.response);
}]);

```
Okay there is a lot going on in there. So let me break it down. Microsoft bot framework lets you chain functions for handlers by passing in an array of functions. You can use this to run functions one after other collecting data and using it in the next function. You use prompts to ask for data. You can read more about this in the official documentation.

Now you can save the app and restart and it should prompt for city if you don’t provide it.

``` 
node index.js
```

```
what is the weather?

Which city do you want the weather for?

Toronto 

It's 27 degrees celsius in Toronto

```

Now that we have this working, lets hook it up to the api and get real weather data.

So firstly create an account for yourself on [APIXU](https://www.apixu.com/ "APIXU"). Once you do that you will get a API Access Key and you can play around the API by clicking on getting started. Put in a few city names and get a feel of how it works.

Keep your api access key handy we will be needing it to make the api calls. We will be using the request module on npm to make the calls, so lets start by installing it.

```
npm install --save request
```
Once we have request installed lets require it by adding in the following lines at the top of index.js

```JavaScript
var request = require('request');
```
Now that we have access to request module lets put in code to get weather data from API

```JavaScript
intents.matches('whatIsWeather', [function (session, args) {
    var city = builder.EntityRecognizer.findEntity(args.entities, 'cities');
    if (city) {
        var city_name = city.entity;
        var url = "http://api.apixu.com/v1/current.json?key="<Your API Key>"&q=" + city_name;
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
    var url = "http://api.apixu.com/v1/current.json?key="<Your API key>"&q=" + city_name;
    request(url, function (error, response, body) {
        body = JSON.parse(body);
        temp = body.current.temp_c;
        session.send("It's " + temp + " degrees celsius in " + city_name);
    });
}]);
```
Once you save and restart your app, it should be working as expected.

```
node index.js
```
```
What's the weather in Ottawa?

It's 12 degrees celsius in Ottawa
```
![Bot Output](http://shah0150.edumedia.ca/Azure/bot_output)

You have your AI Bot ready to get deployed in real world
