PDFs = new FilesCollection({
  collectionName: 'pdfs',
  allowClientCode: false, // Disallow remove files from Client~/tmp/
  storagePath: '~/vtmp/',
  onBeforeUpload: function (file) {
    if (file.size > 5 * 1024 * 1024) {
      return 'Please file with size less than 5MB';
    } else if (file['mime'] !== 'application/pdf') {
      return 'Please upload a PDF file';
    } else {
      return true;
    }
  }
});

if (Meteor.isClient) {
  Meteor.subscribe('files.pdf.all');
}

if (Meteor.isServer) {
  Meteor.publish('files.pdf.all', function () {
    return PDFs.collection.find({});
  });
}
