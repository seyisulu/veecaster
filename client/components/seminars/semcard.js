Template.semcard.onRendered(function() {
  let div = this.find('.tbprnt');
  //$('.menu .item').tab();
  $(`#semtab-${div.dataset.semid} .menu .item`).tab({ context: 'parent' });
});

Template.semcard.helpers({
  human: function(dte) {
    return moment(dte).fromNow();
  },
  livecslink: function(seminar) {
    return `/livecs/${seminar.coach}/${seminar._id}`;
  }
})
