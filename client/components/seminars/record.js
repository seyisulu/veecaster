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

var RTCPeer;

var RTCMConn;
var sessID = Session.get('semid');
var roomID = `${Session.get('semid')+'-'+Meteor.userId()}`;
var userID = Session.get('usrid');
var sessionDescription;

function setupPeerMedia() {
  if (supportsMedia()) {
    let iss, pjk;
    Meteor.call('getICEServers', function(error, result) {
      if(error) {
        console.log(error);
      } else {
        iss = result;
      }
    });
    Meteor.call('getPJKey', function(error, result) {
      if(error) {
        console.log(error);
      } else {
        pjk = result.key;
      }
    });
    RTCPeer = new Peer(sessID, {
      key: '4sknyp3axl1pp66r',
      //host:   'veecaster.herokuapp.com', 
      //port:   80,
      debug: 3,
      //secure: true,
      config: { 'iceServers': [
        { 
          urls: [
            'turn:veecaster.com:3478?transport=udp',
            'turn:veecaster.com:3478?transport=tcp',
            'turns:veecaster.com:5349?transport=tcp'
            ], 
          username: 'vee', 
          credential: 'ChocolateyCast3r'
        }
      ]}
    });
    RTCPeer.on('open', function () {
      console.log('Opened:')
      console.log(RTCPeer.id);
    });
    
    console.log('PeerMedia is setup.');
  } else {
    alert('Real-Time Communications (RTC) media not supported on this browser.');
    console.log('RTCMedia not supported on this browser.');
  }
};

function setupRTCMedia() {
  if (supportsMedia()) {
    RTCMConn = new RTCMultiConnection(sessID);
    RTCMConn.session = {
      audio:      true,
      video:      true,
      screen:     false,
      data:       false,
      oneway:     true,
      broadcast:  true,
      inactive:   false
    };
    RTCMConn.maxParticipantsAllowed = 256;
    sessionDescription = RTCMConn.open(roomID);
    Seminars.update({ _id: sessID }, { $set: { session: sessionDescription } });
    var sessDesc = {
      sessionid: sessID,
      userid: userID,
      extra: {},
      session: {
        audio: true,
        video: true
      }
    };
    //RTCMConn.join(roomID);
    //RTCMConn.join(sessDesc);
    
    console.log('RTCMedia is setup.');
  } else {
    alert('Real-Time Communications (RTC) media not supported on this browser.');
    console.log('RTCMedia not supported on this browser.');
  }
};

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
        //Stop echo
        video.volume = 0;
        video.muted = 0;

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
        audioInput.connect(audioGain);
        audioGain.connect(audioContext.destination);
        audioGain.gain.value = 0;

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
  document.getElementById('vee-rec-card').style.backgroundColor = 'red';
  if(!mediaInitialized) {
    setupMedia();
  }
  console.log("Begin Recording");
  audioRecorder.record();
}

function completeRecording() {
  document.getElementById('vee-rec-card').style.backgroundColor = 'white';
  audioRecorder.stop();
  console.log("Recording stopped.");
  document.getElementById('uploading').style.display = 'block';
  window.URL = window.URL || window.webkitURL;

  document.getElementById('uploading').style.display = 'none';
  document.getElementById('uploaded').style.display = 'block';

  audioRecorder.exportWAV(function (audioBlob) {
    document.getElementById('vc-a-save').href = window.URL.createObjectURL(audioBlob);
    document.getElementById('vc-a-save').download = `${Session.get('semid')+'-'+Date.now()}.wav`;
 		audioRecorder.clear();
  });
  
  veeMsg('Audio sucessfully uploaded');
  //mediaStream.stop();
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
  },
  readFile: function (file, callback) {
    var reader = new FileReader;

    var fileInfo = {
      name: file.name,
      type: file.type,
      size: file.size,
      file: null
    }

    reader.onload = function () {
      fileInfo.file = reader.result;
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
  //setupMedia();
  setupPeerMedia();
  document.getElementById('uploading').style.display = 'none';
  document.getElementById('uploaded').style.display = 'none';
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