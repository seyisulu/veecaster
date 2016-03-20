/* global Mongo */
/* global SimpleSchema */
/* global Roles */
Seminars = new Mongo.Collection('seminars');

var Schema = {};

Schema.SeminarOptions = new SimpleSchema({
  down: {
    type: Boolean,
    label: "Enable Downloads"
  },
  chat: {
    type: Boolean,
    label: "Enable Chat"
  },
  live: {
    type: Boolean,
    label: "Broadcasting"
  },
});

Schema.Seminars = new SimpleSchema({
  name: {
    type: String,
    label: "Name"
  },
  // Start date for the Teleseminar
  date: {
    type: Date,
    label: "Date & Time"
  },

  desc: {
    type: String,
    label: "Description"
  },

  coach: {
    type: String,
    label: "Coach"
  },
  // list of email addresses allowed to connect to room
  trainees: {
    type: Array,
    optional: true
  },
  "trainees.$": {
    type: Object
  },
  "trainees.$.email": {
    type: String,
    regEx: SimpleSchema.RegEx.Email
  },
  "trainees.$.names": {
    type: String
  },
  "trainees.$.online": {
    type: String,
    optional: true
  },

  options: {
    type: Schema.SeminarOptions,
    label: 'Options',
    optional: true,
  },
});

Seminars.attachSchema(Schema.Seminars);

// restrict modification access to authorized users
Seminars.allow({
  insert(userId, seminar) {
    return seminar.coach === userId || (Roles.userIsInRole(userId, ['admin']));
  },
  update(userId, seminar, fields, modifier) { // TODO : make this more restrictive based on the fields
    return seminar.coach === userId || (Roles.userIsInRole(userId, ['admin']));
  },
  remove(userId, seminar, fields, modifier) {
    return seminar.coach === userId || (Roles.userIsInRole(userId, ['admin']));
  },
  fetch: ['coach'],
});

if (Meteor.isServer) {
  Meteor.publish("seminars", function () {
    return Seminars.find({ coach: this.userId });
  });
  Meteor.publish("seminar", function (semid) {
    return Seminars.find({ _id: semid });
  });
}

if (Meteor.isClient) {
  
}