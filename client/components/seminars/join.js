Template.join.onCreated(function() {
  var self = this;
  self.autorun(function() {
    self.subscribe('seminar', Session.get('semid'));
  });
});

Template.join.helpers({
  seminar: function() {
    let sem = Seminars.find({ _id: Session.get('semid') })[0];
    return sem;
  },
  havesem: function() {
    return Seminars.find({}).fetch().length > 0? true: false;
  }
});

Template.join.events({
  'submit #join-form': function(evt, tpl) {
    evt.preventDefault();
    let fnd = false,
        eml = tpl.find('#join-email').value.trim(),
        sem = Seminars.find({ 'trainees.email':eml }).fetch()[0];
    if(sem && sem.trainees) {
      let trn = _.find(sem.trainees, function(trainee) {
        return trainee.email === eml;
      });
      if(trn) {
        Session.set('usrid', eml);
        Session.set('fllnm', trn.names);
        FlowRouter.go(`/live/${Session.get('semid')}`);
      } else alert(`Supplied email (${eml}) is not on the attendance list`);
    } else alert(`Supplied email (${eml}) is not on the attendance list`);
    console.log(tpl.find('#join-email').value.trim());
    console.log();
    return false;
  },
});