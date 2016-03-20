function supportsMedia() {
    return !!(navigator.getUserMedia        || 
              navigator.webkitGetUserMedia  || 
              navigator.mozGetUserMedia     || 
              navigator.msGetUserMedia);
}
// cross-browser support for getUserMedia
navigator.getUserMedia =  navigator.getUserMedia        || 
                          navigator.webkitGetUserMedia  || 
                          navigator.mozGetUserMedia     || 
                          navigator.msGetUserMedia;

window.URL = window.URL || window.webkitURL;

window.requestAnimationFrame = (function () {
  return  window.requestAnimationFrame        ||
          window.webkitRequestAnimationFrame  ||
          window.mozRequestAnimationFrame     ||
          window.oRequestAnimationFrame       ||
          window.msRequestAnimationFrame
})();

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var mediaStream;
// global variables for showing/encoding the video
var mediaInitialized = false;
var recording = false;
var videoCanvas;
var videoContext;
var frameTime;
var imageArray = [];

function setupMedia() {
  if (supportsMedia()) {
    audioContext = new AudioContext();

    navigator.getUserMedia(
      {
        video: true,
        audio: true
      },
      function (localMediaStream) {
        // map the camera
        var video = document.getElementById('live_video');
        video.src = window.URL.createObjectURL(localMediaStream);

        // create the canvas & get a 2d context
        videoCanvas = document.createElement('canvas');
        videoContext = videoCanvas.getContext('2d');

        // setup audio recorder
        var audioInput =
            audioContext.createMediaStreamSource(localMediaStream);
        //audioInput.connect(audioContext.destination);
        // had to replace the above with the following to
        // mute playback (so you don't get feedback)
        var audioGain = audioContext.createGain();
        audioGain.gain.value = 0;
        audioInput.connect(audioGain);
        audioGain.connect(audioContext.destination);

        audioRecorder = new Recorder(audioInput);
        mediaStream = localMediaStream;
        mediaInitialized = true;

        document.getElementById('uploading').hidden = true;
      },
      function (e) {
        console.log('web-cam & microphone not initialized: ', e);
      }
    );
    console.log('Media is setup.');
  } else {
    alert('Media not supported on this browser; you can still chat though.');
    console.log('Media not supported on this browser.');
  }
};
// exposed template helpers
//Template.record.supportsMedia = supportsMedia;

function startRecording() {
  console.log("Begin Recording");
  audioRecorder.record();
}

function completeRecording() {
  let user = Meteor.user();
  audioRecorder.stop();
  console.log("completeRecording: " + user._id);

  document.getElementById('uploading').hidden = false;

  audioRecorder.exportWAV(function (audioBlob) {
    // save to the db
    BinaryFileReader.read(audioBlob, function (err, fileInfo) {
      UserAudios.insert({
        coach: user._id,
        audio: fileInfo,
        save_date: Date.now()
      });
    });
    console.log("Audio uploaded");
  });

  document.getElementById('uploading').hidden = true;
  veeMsg('Audio sucessfully uploaded');
  mediaStream.stop();
  //FlowRouter.go('/app/seminars');
}

var BinaryFileReader = {
  read: function (file, callback) {
    var reader = new FileReader;

    var fileInfo = {
      name: file.name,
      type: file.type,
      size: file.size,
      file: null
    }

    reader.onload = function () {
      fileInfo.file = new Uint8Array(reader.result);
      callback(null, fileInfo);
    }
    reader.onerror = function () {
      callback(reader.error);
    }

    reader.readAsArrayBuffer(file);
  }
};

Template.start.onCreated(function() {
  var self = this;
  self.autorun(function() {
    
  });
});

Template.record.onRendered(function () {
  setupMedia();
});

Template.record.events({
  'click .telestarter': function(evt, tpl) {
    evt.preventDefault();
    tpl.find('#telestopper').disabled = false;
    tpl.find('#telestarter').disabled = true;
    startRecording();
    console.log('Started.');
  },
  'click .telestopper': function(evt, tpl) {
    console.log('Stopped.');
    evt.preventDefault();
    tpl.find('#telestopper').disabled = true;
    tpl.find('#telestarter').disabled = false;
    completeRecording();
  }
});

Template.record.helpers({
  fllnm: function() {
    return Session.get('fllnm');
  },
  supportsMedia: supportsMedia
})