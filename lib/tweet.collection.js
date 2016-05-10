/* global Mongo */
/* global SimpleSchema */
/* global Roles */
Tweets = new Mongo.Collection('tweets');

var Schema = {};

Schema.Tweets = new SimpleSchema({
  sem: {
    type: String,
    label: "Seminar"
  },
  twt: {
    type: [Object],
    label: "Tweets",
    blackbox: true
  },
  usr: {
    type: String,
    label: "Coach"
  },
});

Tweets.attachSchema(Schema.Tweets);

if (Meteor.isServer) {
  Meteor.publish("tweets", function (seminar_id) {
    return Tweets.find({ sem: seminar_id });
  });
}
