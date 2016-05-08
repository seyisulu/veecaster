/* global Mongo */
/* global SimpleSchema */
/* global Roles */
Messages = new Mongo.Collection('messages');

var Schema = {};

Schema.Messages = new SimpleSchema({
  sem: {
    type: String,
    label: "Seminar"
  },

  msg: {
    type: String,
    label: "Message"
  },

  usr: {
    type: String,
    label: "Participant"
  },

  uid: {
    type: String,
    label: "Email"
  },

  dte: {
    type: String,
    label: "Date & Time"
  },
});

Messages.attachSchema(Schema.Messages);

// TODO: Refactor to use methods
Messages.allow({
  insert(userId, message) {
    return true;
  },
  update(userId, message, fields, modifier) {
    return false;
  },
  remove(userId, message, fields, modifier) {
    return false;
  },
});

if (Meteor.isServer) {
  Meteor.publish("messages", function (seminar) {
    return Messages.find({ sem: seminar });
  });
}

if (Meteor.isClient) {

}
