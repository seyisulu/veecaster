/* global Mongo */
/* global SimpleSchema */
/* global Roles */
Recordings = new Mongo.Collection('recordings');

Recordings.allow({
  insert(userId, recording) {
    return true;
  },
  update(userId, recording, fields, modifier) {
    return userId === recording.coach;
  },
  remove(userId, audio, fields, modifier) {
    return false;
  }
});

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.methods({
      removeAllRecordings: function (userId) {
        Recordings.remove({ coach: userId });
      }
    });
  });
}
