let insmsg = (sem, msg, usr, tpl) => {
  Messages.insert({
    sem: sem,
    msg: msg,
    usr: usr,
    dte: new Date()
  }, function(error, result) {
    if(error) {
      alert('One or more errors occured.');
      console.log(error.invalidKeys);
    } else {
      tpl.find('#txtchat').value = '';
    }
  });
};

Template.live.onCreated(function() {
  var self = this;
  self.autorun(function() {
    self.subscribe('messages', Session.get('semid'));
    self.subscribe('seminar', Session.get('semid'));
  });
});

Template.live.onRendered(function() {
  $('.menu .item').tab();
});

Template.live.events({
  'click #btnchat': function(evt, tpl) {
    evt.preventDefault();
    insmsg(Session.get('semid'),tpl.find('#txtchat').value.trim(),Session.get('usrid'), tpl);
    return false;
  },
  'keyup #txtchat': function(evt, tpl) {
    if(evt.which === 13) {
      evt.preventDefault();
      insmsg(Session.get('semid'),tpl.find('#txtchat').value.trim(),Session.get('usrid'), tpl);
      return false;
    }
  }
});

Template.live.helpers({
  messages: function() {
    var msgs = Messages.find({});
    return msgs;
  },
  havemsgs: function() {
    return Messages.find({}).fetch().length > 0? true: false;
  },
  human: function(dte = new Date()) {
    return moment(dte).fromNow();
  },
  usrnm: function(email = 'anonymous@gmail.com') {
    return email.split('@')[0];
  },
  semname: function() {
    let sem = Seminars.findOne({_id:Session.get('semid')});
    if(sem) {
      return sem.name;
    }
    return "Veecaster Teleseminar";
  },
  sendmsg: function(msg, template) {
    Messages.insert({
      sem: Session.get('semid'),
      msg: template.find('#txtchat').value.trim(),
      usr: Session.get('usrid'),
      dte: new Date()
    }, function(error, result) {
      if(error) {
        alert('One or more errors occured.');
        console.log(error.invalidKeys);
      } else {
        template.find('#txtchat').value = '';
      }
    });
    return false;
  }
});