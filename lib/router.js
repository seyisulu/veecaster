/* global Tracker */
/* global Seminars */
/* global Accounts */
/* global BlazeLayout */

//BlazeLayout.setRoot('#defcon');

function checkLoggedIn (ctx, redirect) {
  if (!Meteor.userId()) {
    redirect('/sign-in');
  }
}

function redirectIfLoggedIn (ctx, redirect) {
  if (Meteor.userId()) {
    redirect('/app/seminars');
  }
}

var publicRoutes = FlowRouter.group({
  name: 'public',
  triggersEnter: [
    redirectIfLoggedIn
  ]
});

publicRoutes.route('/', {
  name: 'home',
  action: function() {
    BlazeLayout.render("homeLayout", { content: "homePage" });
  }
});

publicRoutes.route('/sign-in', {
  name: 'signin',
  action() {
    BlazeLayout.render("authLayout", { content: "signIn" });
  }
});

publicRoutes.route('/sign-up', {
  name: 'signup',
  action() {
    BlazeLayout.render("authLayout", { content: "signUp" });
  }
});

var privateRoutes = FlowRouter.group({
  name: 'private',
  prefix: '/app',
  triggersEnter: [
    checkLoggedIn
  ]
});

privateRoutes.route('/seminars', {
  name: 'seminars',
  action() {
    BlazeLayout.render("siteLayout", { content: "seminars" });
  }
});

privateRoutes.route('/sign-out', {
  name: 'signout',
  triggersEnter: [
    function(context, redirect) {
      console.log('>:< Signing Out');
      Meteor.logout();
      //FlowRouter.redirect('/');
    },
  ],
  action(params, queryParams) {
    FlowRouter.go('/');
  }
});

FlowRouter.notFound = {
  subscriptions: function() {

  },
  action: function(params, queryParams) {
    BlazeLayout.render("authLayout", { content: "notFound" });
  }
};

publicRoutes.route('/join/:coach/:sid', {
  name: 'join',
  triggersEnter: [
    function(context, redirect) {
      Session.set('semid', context.params.sid);
    },
  ],
  action() {
    BlazeLayout.render("openLayout", { content: "join" });
  }
});

FlowRouter.route('/livecs/:coach/:sid', {
  name: 'livecs',
  triggersEnter: [
    function(context, redirect) {
    },
  ],
  action() {
    Session.set('coach', context.params.coach);
    Session.set('semid', context.params.sid);
    if(Meteor.userId()) {
      BlazeLayout.render("siteLayout", { content: "livecs" });
    } else {
      BlazeLayout.render("openLayout", { content: "livecs" });
    }
  }
});

if(Meteor.isClient) {
  Accounts.onLogin(function () {
    console.log('>:< Signing In');
    if(FlowRouter.current() &&
       FlowRouter.current().route &&
       FlowRouter.current().route.group &&
       FlowRouter.current().route.group.name === 'public') {
      FlowRouter.go('/app/seminars');
    }
  });
  if (Meteor.isClient) {
    Tracker.autorun(function () {
      if (!Meteor.userId()) {
        //FlowRouter.go('/');
      }
    });
  }
}
