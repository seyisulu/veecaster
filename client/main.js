/* global moment */
/* global Template */
/* global Meteor */
/* global FlowRouter */
Meteor.startup(() => {

});

veeMsg = function(msg) {
  Session.set('mdlmg', msg);

  $('#veemdl')
    .modal({
      closable  : false,
      onDeny    : function() {
        console.log('Modal Cancel.');
        return false;
      },
      onApprove : function() {
        console.log('Modal OK.');
      }
    })
    .modal('setting', 'transition', 'horizontal flip')
    .modal('show');
};

//Body

Template.body.helpers({
  human: function(dte) {
    return moment(dte).fromNow();
  }
});

//Home

Template.homeLayout.onRendered(function() {
  console.log('Home rendered.');
  $('.masthead')
    .visibility({
      once: false,
      onBottomPassed: function() {
        $('.fixed.menu').transition('fade in');
      },
      onBottomPassedReverse: function() {
        $('.fixed.menu').transition('fade out');
      }
    });
  $('.ui.sidebar').sidebar('attach events', '.toc.item');
});

Template.authLayout.onRendered(function() {
  $('.ui.form')
    .form({
      fields: {
        email: {
          identifier  : 'email',
          rules: [
            { type    : 'empty', prompt : 'Please enter your e-mail' },
            { type    : 'email', prompt : 'Please enter a valid e-mail' }
          ]
        },
        password: {
          identifier  : 'password',
          rules: [
            { type    : 'empty',     prompt : 'Please enter your password' },
            { type    : 'length[6]', prompt : 'Your password must be at least 6 characters' }
          ]
        }
      }
    });
  $('.ui.dropdown').dropdown();
});

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

Template.siteLayout.onRendered(function() {
  $('.veemenu')
    .visibility({
      once: false,
      onBottomPassed: function() {
        $('.fixed.menu').transition('fade in');
      },
      onBottomPassedReverse: function() {
        $('.fixed.menu').transition('fade out');
      }
    });
  $('.ui.sidebar').sidebar('attach events', '.toc.item');
});

Template.siteLayout.helpers({
  mdlmsg: function(dte) {
    return 'Modal message.';
  }
});