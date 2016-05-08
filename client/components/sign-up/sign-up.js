Template.signUp.events({
  'submit #signup-form': function(e, t) {
    e.preventDefault();
    let id, user = {};
    user.f = t.find('#signup-fname').value.trim();
    user.l = t.find('#signup-lname').value.trim();
    user.t = t.find('#signup-twittr').value.trim();
    user.g = t.find('#signup-gender').value.trim();
    user.e = t.find('#signup-email').value.trim();
    user.p = t.find('#signup-password').value.trim();
    
    console.log('user: ', user);
    
    id = Accounts.createUser({
      email: user.e,
      password: user.p,
      fname: user.f,
      lname: user.l,
      twittr: user.t,
      gender: user.g
    },
    function(error) {
      if(!error){
        veeMsg("Registration successful!");
        FlowRouter.go('/');
      } else {
        veeMsg(error.reason);
      }
    });
    if(!id) {
      veeMsg("An error has occured!");
    }
    console.log( id );
    return false; 
  }
});