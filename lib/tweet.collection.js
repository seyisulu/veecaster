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
    type: String,
    label: "Tweets"
  }
});

//Tweets.attachSchema(Schema.Tweets);

if (Meteor.isServer) {
  Meteor.publish("tweets", function (seminar) {
    return Tweets.find({ sem: seminar });
  });
}

if (Meteor.isClient) {

}
