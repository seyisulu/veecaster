//import Dropbox from 'dropbox';
//import fs from 'fs';

var bound, Dropbox, YandexDisk, disk, fs, client;
if (Meteor.isServer) {
  bound = Meteor.bindEnvironment(function(callback) {
    return callback();
  });
  Dropbox = require('dropbox');
  //YandexDisk = require('yandex-disk').YandexDisk;
  //disk = new YandexDisk(Meteor.settings.private.yandex.token);
  //disk.timeout = 60000;
  //disk.cd('/VeeDisk/');
  //console.log(disk);
  fs = require('fs');

  client = new Dropbox.Client({
    key: Meteor.settings.private.dropbox.key,
    secret: Meteor.settings.private.dropbox.secret,
    token: Meteor.settings.private.dropbox.token
  });
}

PDFs = new FilesCollection({
  debug: true,
  throttle: false,
  collectionName: 'pdfs',
  allowClientCode: false, // Disallow remove files from Client~/tmp/
  onBeforeUpload: function (file) {
    const maxpdfsz = Meteor.settings.public.veecaster.maxpdfszMB;
    if (file.size > maxpdfsz * 1024 * 1024) {
      return `Please file with size less than ${maxpdfsz}MB`;
    } else if (file['mime'] !== 'application/pdf') {
      return 'Please upload a PDF file';
    } else {
      return true;
    }
  },
  onAfterUpload: function(fileRef) {
    // In onAfterUpload callback we will move file to DropBox
    var self;
    self = this;//TODO: explore using fs to move file to public
    /*
    let fpth = fileRef._id + "." + fileRef.extension;
    disk.uploadFile(fileRef.path, fpth, Meteor.bindEnvironment((err, res) => {
      console.log('res:', res);
      console.log(err && err || res);
    }));
    */
    fs.readFile(fileRef.path, function(error, data) {
      bound(function() {
        if (error) {
          console.error(error);
        } else {
          // Write file to DropBox
          client.writeFile(fileRef._id + "." + fileRef.extension, data, function(error, stat) {
            bound(function() {
              if (error) {
                console.error(error);
              } else {
                client.makeUrl(stat.path, {
                  long: true,
                  downloadHack: true // Used to get permanent link
                }, function(error, xml) {
                  bound(function() {
                    console.log(xml);
                    // Store downloadable in file's meta object
                    self.collection.update({
                      _id: fileRef._id
                    }, {
                      $set: {
                        'meta.pipeFrom': xml.url,
                        'meta.pipePath': stat.path
                      }
                    }, function(error) {
                      if (error) {
                        console.error(error);
                      } else {
                        // Remove file from FS
                        //self.unlink(fileRef);
                      }
                    });
                  });
                });
              }
            });
          });
        }
      });
    });
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
