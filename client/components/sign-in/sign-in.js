Template.signIn.events({
  'submit #signin-form': function(e, t) {
    e.preventDefault();
    var email = t.find('#signin-email').value.trim()
      , password = t.find('#signin-pwd').value.trim();

    Meteor.loginWithPassword(email, password, function(err){
      if (err){
        alert('Invalid username and/or password.');
      } else {
        FlowRouter.go('/app/seminars');
      }
    });
    return false; 
  }
});