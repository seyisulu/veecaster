Template.semcard.onRendered(() => {
  $('.menu .item').tab();
});

Template.semcard.helpers({
  human: function(dte) {
    return moment(dte).fromNow();
  },
  livecslink: function(seminar) {
    return `/livecs/${seminar.coach}/${seminar._id}`;
  }
})
