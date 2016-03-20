/* global Mongo */
/* global SimpleSchema */
/* global Roles */
Recordings = new Mongo.Collection('recordings');

UserAudios = new Meteor.Collection('audios');
UserVideos = new Meteor.Collection('videos');

UserAudios.allow({
  insert(userId, audio) {
    return true;
  },
  update(userId, audio, fields, modifier) { // TODO : make this more restrictive based on the fields
    return true;
  },
  remove(userId, audio, fields, modifier) {
    return false;
  }
});

UserVideos.allow({
  insert(userId, video) {
    return true;
  },
  update(userId, video, fields, modifier) { // TODO : make this more restrictive based on the fields
    return true;
  },
  remove(userId, video, fields, modifier) {
    return false;
  }
});

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.methods({
      removeAll: function () {
        UserAudios.remove({});
        UserVideos.remove({});
      }
    });
  });
}