'use strict';

const Alexa = require('ask-sdk-core');
const request = require('request-promise');

const apiKey = require('./private/key');
const baseUrl = 'http://api.bart.gov/api/';

let skill,
    originStation = 'ashb';

// Code for the handlers here
exports.handler = async function (event, context) {
  console.log(`REQUEST++++${JSON.stringify(event)}`);
  if (!skill) {
    skill = Alexa.SkillBuilders.custom()
      .addRequestHandlers(
        LaunchRequestHandler,
        NextTrainIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
      )
      .addErrorHandlers(ErrorHandler)
      .create();
  }
  
  return skill.invoke(event,context);
}


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = 'Welcome to the Alexa Skills Kit, you can say hello!';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Open Houses Launch', speechText)
            .getResponse();
    }
};

const NextTrainIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'NextTrainIntent';
    },
    handle(handlerInput) {
        const path = 'etd.aspx?cmd=etd&orig=' + originStation + '&key=' + apiKey.key + '&dir=s&json=y';

        return request(baseUrl + path)
            .then((aResponse) => {
                let minutesToNextTrain = getMinutesFromResponse(JSON.parse(aResponse));
                let speechText = 'The next train will arrive at Ashby station in ' + minutesToNextTrain + ' minutes.';

                return handlerInput.responseBuilder
                    .speak(speechText)
                    .withSimpleCard('Next Train Request Received', speechText)
                    .getResponse();
            })
            .catch((aError) => {
                console.log('Request Error!');
                console.log(aError);
                return handlerInput.responseBuilder
                    .speak("Sorry but I had a problem with that request. Please try again.")
                    .withSimpleCard('Error processing next train request: ', speechText)
                    .getResponse();
            });
    }
};

const getMinutesFromResponse = (aResponse) => {
    let timeToNextTrain;
    console.log(aResponse.root.station[0].etd);
    timeToNextTrain = aResponse.root.station[0].etd[0].estimate[0].minutes;
    return timeToNextTrain;
}

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'You can say hello to me!';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Next Bart help', speechText)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('Next Bart cancel', speechText)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        //any cleanup logic goes here
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
      return true;
    },
    handle(handlerInput, error) {
      console.log(`Error handled: ${error.message}`);

      return handlerInput.responseBuilder
        .speak('Sorry, I can\'t understand the command. Please say again.')
        .reprompt('Sorry, I can\'t understand the command. Please say again.')
        .getResponse();
    },
};
