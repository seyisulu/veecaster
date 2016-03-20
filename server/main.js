Accounts.config({
  sendVerificationEmail: false
});

Meteor.startup(() => {
  if (Meteor.users.find().fetch().length === 0) {
    let users = [
      {
        fname: 'Abbie',
        lname: 'Bells',
        email: 'a@b.com',
        g: 'Female',
        roles: ['coach']
      },
      {
        fname: 'Hello',
        lname: 'Veecaster',
        email: 'hello@veecaster.com',
        g: 'Female',
        roles: ['coach']
      },
      {
        fname: 'Emmanuel',
        lname: 'Olowosulu',
        email: 'eolowo@veecaster.com',
        g: 'Male',
        roles: ['admin']
      },
    ];

    _.each(users, (user) => {

      let id = Accounts.createUser({
        email: user.email,
        password: 'passme',
        profile: { fname: user.fname, lname: user.lname, twittr: '@null', gender: user.g },
      });

      if (user.roles.length > 0) {
        // Need _id of existing user record so this call must come
        // after `Accounts.createUser` or `Accounts.onCreate`
        Roles.addUsersToRoles(id, user.roles);
      }
    });
  }
  
  smtp = {
    username: 'dan@danyll.com',
    password: 'y3Z8TQxpxCiYsJJsCwyV0A',
    server:   'smtp.mandrillapp.com',
    port: 587
  };
    
  process.env.MAIL_URL = 'smtp://' + encodeURIComponent(smtp.username) + ':' + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port;

});