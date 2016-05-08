Template.seminars.onCreated(function() {
  var self = this;
  self.autorun(function() {
    self.subscribe('seminars');
  });
});
Template.seminars.onRendered(function() {
  let today = new Date();
  $('#semdate').calendar({
    minDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    maxDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 365)
  });
  $('#semform')
    .form({
      fields: {
        name: {
          identifier  : 'name',
          rules: [
            { type    : 'empty', prompt : 'Type in the teleseminar name' }
          ]
        },
        date: {
          identifier  : 'date',
          rules: [
            { type    : 'empty', prompt : 'Please pick a date' }
          ]
        },
        desc: {
          identifier  : 'desc',
          rules: [
            { type    : 'empty', prompt : 'Please write a description' }
          ]
        }
      }
    });
});
Template.seminars.helpers({
  seminars: function() {
    var sems = Seminars.find({});
    return sems;
  },
  havesems: function() {
    return Seminars.find({}).fetch().length > 0? true: false;
  },
  human: function(dte) {
    return moment(dte).fromNow();
  },
  startlink: function(id) {
    return `/app/start/${id}`;
  },
  livecslink: function(seminar) {
    return `/livecs/${seminar.coach}/${seminar._id}`;
  }
});
Template.seminars.events({
  'submit #semform': function(e, t) {
    e.preventDefault();
    var name = t.find('#sf-name').value.trim()
      , date = t.find('#sf-date').value.trim()
      , desc = t.find('#sf-desc').value.trim()
      , down = true
      , chat = true
      , live = false;

    Seminars.insert({
      name: name,
      date: date,
      desc: desc,
      coach: Meteor.userId(),
      options: { down: down, chat: chat, live: live }
    }, function(error, result) {
      if(error) {
        alert('One or more errors occured.');
        console.log(error.invalidKeys);
      } else {
        $('#semform')[0].reset();
      }
    });
    return false;
  }
});
