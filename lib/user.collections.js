Schema = {};

Schema.UserProfile = new SimpleSchema({
  fname: {
    type: String
  },
  lname: {
    type: String
  },
  twittr: {
    type: String,
    optional: true
  },
  gender: {
    type: String,
    allowedValues: ['Male', 'Female'],
    optional: true
  }
});

Schema.User = new SimpleSchema({
  emails: {
    type: Array,
    optional: true
  },
  "emails.$": {
    type: Object
  },
  "emails.$.address": {
    type: String,
    regEx: SimpleSchema.RegEx.Email
  },
  "emails.$.verified": {
    type: Boolean
  },
  createdAt: {
    type: Date
  },
  profile: {
    type: Schema.UserProfile,
    optional: true
  },
  services: {
    type: Object,
    optional: true,
    blackbox: true
  },
  roles: {
    type: [String],
    optional: true
  },
  // In order to avoid an 'Exception in setInterval callback' from Meteor
  heartbeat: {
    type: Date,
    optional: true
  }
});

Meteor.users.attachSchema(Schema.User);
/*
Meteor.publish(null, function() {
  if (this.userId) {
    return Meteor.users.findOne(this.userId, {
      fields: { 'profile.fname': 1, 'profile.lname': 1, 'profile.gender': 1 }
    });
  }else{
      this.ready();
  }
});
*/
if(Meteor.isServer) {
  Accounts.onCreateUser(function(options, user) {
    user.profile = options.profile || {};

    // Assigns first and last names to the newly created user object
    user.profile.fname = options.fname;
    user.profile.lname = options.lname;
    user.profile.twittr = options.twittr;
    user.profile.gender = options.gender;

    user.roles = ['Coach'];
    console.log('user:', user);
    return user;
  });
}