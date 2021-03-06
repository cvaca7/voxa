/**
 * State Machine Skill Tests
 *
 * Copyright (c) 2016 Rain Agency.
 * Licensed under the MIT license.
 */

'use strict';

const expect = require('chai').expect;
const Voxa = require('../');
const views = require('./views');
const variables = require('./variables');
const _ = require('lodash');

const TEST_URLS = [
  'https://s3.amazonaws.com/alexa-voice-service/welcome_message.mp3',
  'https://s3.amazonaws.com/alexa-voice-service/bad_response.mp3',
  'https://s3.amazonaws.com/alexa-voice-service/goodbye_response.mp3',
];

const states = {
  entry: {
    LaunchIntent: 'launch',
    'AMAZON.PreviousIntent': 'previous',
    'AMAZON.StopIntent': 'exit',
    'AMAZON.CancelIntent': 'exit',
  },
  previous: function enter(request) {
    let index = 0;
    let shuffle = 0;
    let loop = 0;

    if (request.context && request.context.AudioPlayer) {
      const token = JSON.parse(request.context.AudioPlayer.token);
      index = token.index - 1;
      shuffle = token.shuffle;
      loop = token.loop;
    }

    if (index === -1) {
      index = TEST_URLS.length - 1;
    }

    const directives = {};
    directives.type = 'AudioPlayer.Play';
    directives.playBehavior = 'REPLACE_ALL';
    directives.token = createToken(index, shuffle, loop);
    directives.url = TEST_URLS[index];
    directives.offsetInMilliseconds = 0;

    return { reply: 'LaunchIntent.OpenResponse', directives };
  },
  exit: function enter() {
    return { reply: 'ExitIntent.Farewell' };
  },
  launch: function enter() {
    return { reply: 'LaunchIntent.OpenResponse' };
  },
};

function createToken(index, shuffle, loop) {
  return JSON.stringify({ index, shuffle, loop });
}

describe('StateMachineSkill', () => {
  let skill;

  beforeEach(() => {
    skill = new Voxa({ views, variables });
    _.map(states, (state, name) => {
      skill.onState(name, state);
    });
  });

  itIs('audioPrevious', (reply) => {
    expect(reply.msg.statements[0]).to.include('Hello! Good');

    const token = JSON.parse(reply.msg.directives.token);
    expect(token.index).to.equal(0, 'AUDIO INDEX 0');
  });

  function itIs(requestFile, cb) {
    it(requestFile, () => {
      const event = require(`./requests/${requestFile}.js`);
      return skill.execute(event).then(cb);
    });
  }
});
