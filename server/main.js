Accounts.config({
  sendVerificationEmail: false
});

Meteor.startup(() => {
  Tweets._ensureIndex({ 'sem': 1 });
  Messages._ensureIndex({ 'sem': 1 });
  Seminars._ensureIndex({ 'coach': 1 });

  if (Meteor.users.find().fetch().length === 0) {
    let users = [
      {
        fname: 'Abbie',
        lname: 'Bells',
        email: 'a@b.com',
        g: 'Female',
        roles: ['Coach']
      },
      {
        fname: 'Hello',
        lname: 'Veecaster',
        email: 'hello@veecaster.com',
        g: 'Female',
        roles: ['Coach']
      },
      {
        fname: 'Emmanuel',
        lname: 'Olowosulu',
        email: 'eolowo@veecaster.com',
        g: 'Male',
        roles: ['Admin']
      },
    ];

    _.each(users, (user) => {

      let id = Accounts.createUser({
        email: user.email,
        password: Meteor.settings.private.veecaster.defpass,
        profile: { fname: user.fname, lname: user.lname, twittr: '@seyisulu', gender: user.g },
      });

      if (user.roles.length > 0) {
        // Need _id of existing user record so this call must come
        // after `Accounts.createUser` or `Accounts.onCreate`
        Roles.addUsersToRoles(id, user.roles);
      }
    });
  }


  var BinaryServer = require('binaryjs').BinaryServer;
  var fs = require('fs');
  var server = BinaryServer({ port: Meteor.settings.public.veecaster.binsrvlocl });

  server.on('connection', function(client) {
    console.log('>:< Binary server connection');
    client.on('stream', function(stream, meta) {
      console.log('|:> Audio stream started');
      // broadcast to all other clients
      for(var id in server.clients){
        if(server.clients.hasOwnProperty(id)){
          var otherClient = server.clients[id];
          if(otherClient != client){
            var send = otherClient.createStream(meta);
            stream.pipe(send);
          } // if (otherClient...
        } // if (binaryserver...
      } // for (var id in ...
      stream.on('end', function() {
        console.log('[:] Audio stream ended');
      });
    }); //client.on
  }); //server.on

  smtp = Meteor.settings.private.veecaster.smtp;

  process.env.MAIL_URL = 'smtp://' + encodeURIComponent(smtp.username) + ':' + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port;

});
