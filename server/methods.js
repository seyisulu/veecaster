import Twit from 'twit';
import { check, Match } from 'meteor/check';

Meteor.methods({
  'getDICEServers': function(usrnm) { //Dynamic (ephemeral) credentials
    check(usrnm, String);
    var tomorrowTS = Math.floor(Date.now() / 1000) + (24*60*60);
    var cplxUsrnm = usrnm + ':' + tomorrowTS;
    var pwd =
      CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(
      CryptoJS.HmacSHA1(cplxUsrnm, 'chocolate').toString()));
    return { 'iceServers': [
      {
        url: 'turn:veecaster.com',
        credential: pwd,
        username: cplxUsrnm
      }
    ]};
  },
  'getTweets': function(opts) {
    check(opts, { scr: String, sem: String, n: Match.Integer });
    var topts = { screen_name: opts.scr, count: opts.n > 200? 200: opts.n },
        fclbk = Meteor.bindEnvironment((err, dat, res) => {
          twt = Tweets.findOne({ sem: opts.sem });
          twt && Tweets.update({ _id: twt._id}, { $set: { twt: dat }})
              || Tweets.insert({ sem: opts.sem, twt: err && [] || dat, usr: Meteor.userId() });
        }),
        T = new Twit({
          consumer_key:         Meteor.settings.private.twitter.consumer_key,
          consumer_secret:      Meteor.settings.private.twitter.consumer_secret,
          access_token:         Meteor.settings.private.twitter.access_token,
          access_token_secret:  Meteor.settings.private.twitter.access_token_secret,
          app_only_auth:        false,
          timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
        });
    T.get('statuses/user_timeline', topts, fclbk);
  }
});
