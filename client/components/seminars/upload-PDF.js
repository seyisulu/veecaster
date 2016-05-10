Template.uploadPDF.onCreated(function () {
  //this.currentFile = new ReactiveVar(false);
  Session.setDefault('currentFile', false);
  if(!!Session.get('currentFile')) {
    Session.set('currentFile',  false);
  }
});

Template.uploadPDF.onDestroyed(function () {
  Session.set('currentFile', false);
});

Template.uploadPDF.helpers({
  fileOrSelect: function (sem) {
    return sem.pdf && sem.pdf.name || 'Select File';
  },
  currentFile: function () {
    return Session.get('currentFile');
  },
  progress: function () {
    var _cf = Session.get('currentFile');
    if (_cf) {
      return _cf.progress.curValue;
    } else {
      return 0;
    }
  },
});

Template.uploadPDF.events({
  'click #resetPDF': function (evt, tpl) {
    Session.set('currentFile',  false);
  },
  'change #fileInput': function (e, template) {
    if (e.currentTarget.files && e.currentTarget.files[0]) {
      var file = e.currentTarget.files[0];
      Session.set('currentFile', PDFs.insert({
        file: file,
        onUploaded: function (error, fileObj) {
          if (error) {
            veeMsg('Error during upload: ' + error, 'warning');
          } else {
            Seminars.update({ _id: e.currentTarget.dataset['semid'] },
                            { $set: { pdf: { id: fileObj._id, name: fileObj.name } }});
            veeMsg('File "' + fileObj.name + '" successfully uploaded');
          }
          Session.set('currentFile', false);
        },
        streams: 'dynamic',
        chunkSize: 'dynamic'
      }));
    }
  }
});
