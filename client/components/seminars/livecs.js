import Recorder from '../../lib/recorder-js/recorder';

let insmsg = (sem, msg, usr, uid, tpl) => {
  Messages.insert({
    sem: sem,
    msg: msg,
    usr: usr,
    uid: uid,
    dte: Date.now()
  }, function(error, result) {
    if(error) {
      veeMsg('>:< ' + error,'warning');
    } else {
      tpl.find('#txtchat').value = '';
      //rfrshMsgs();
    }
  });
};

/*
Live audio broadcast section
*/

var BinaryFileReader = {
  read: (file, callback) => {
    var reader = new FileReader;
    var fileInfo = {
      name: file.name,
      type: file.type,
      size: file.size,
      file: null
    }
    reader.onload = () => {
      fileInfo.file = new Uint8Array(reader.result);
      callback(null, fileInfo);
    }
    reader.onerror = () => { callback(reader.error); }
    reader.readAsArrayBuffer(file);
  },
  readFile: (file, callback) => {
    var reader = new FileReader;
    var fileInfo = {
      name: file.name,
      type: file.type,
      size: file.size,
      file: null
    }
    reader.onload = () => {
      fileInfo.file = reader.result;
      callback(null, fileInfo);
    }
    reader.onerror = () => { callback(reader.error); }
    reader.readAsArrayBuffer(file);
  }
};
function convertFloat32ToInt16(buffer) {
  l = buffer.length;
  buf = new Int16Array(l);
  while (l--) {
    buf[l] = Math.min(1, buffer[l])*0x7FFF;
  }
  return buf.buffer;
}
// cross-browser supportsMedia query
function supportsMedia() {
  return !!(navigator.getUserMedia              ||
            navigator.webkitGetUserMedia        ||
            navigator.mediaDevices.getUserMedia ||  //New addition
            navigator.mozGetUserMedia           ||
            navigator.msGetUserMedia);
}
// cross-browser support for getUserMedia
navigator.getUserMedia =  navigator.getUserMedia        ||
                          navigator.webkitGetUserMedia  ||
                          navigator.mediaDevices.getUserMedia ||  //New addition
                          navigator.mozGetUserMedia     ||
                          navigator.msGetUserMedia;

navigator.mediaDevices = navigator.mediaDevices ||
   ((navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
     getUserMedia: function(c) {
       return new Promise(function(y, n) {
         (navigator.mozGetUserMedia ||
          navigator.webkitGetUserMedia).call(navigator, c, y, n);
       });
     }
} : null);

window.URL = window.URL || window.webkitURL;
window.requestAnimationFrame = (function () {
  return  window.requestAnimationFrame        ||
          window.webkitRequestAnimationFrame  ||
          window.mozRequestAnimationFrame     ||
          window.oRequestAnimationFrame       ||
          window.msRequestAnimationFrame
})();
window.AudioContext = window.AudioContext || window.webkitAudioContext;

//videoCanvas
var soundController = {},
    client, context, counter = 0,
    mediaStreamCoach, audioRecorder,
    recorderSetup;

soundController.streamerProcess = function (e) {
  var left = e.inputBuffer.getChannelData(0);
  if (soundController.streaming === true) {
    // var chunk = convertFloat32ToInt16(left);
    var chunk = left;
    //console.log(++counter);
    soundController.stream.write(chunk);
  }
};
soundController.startStreaming = function () {
  if (soundController.streaming === false) {
    console.log('>:> Start streaming');
    counter = 0;
    soundController.stream = client.createStream({ data: 'audio' });
    soundController.streaming = true;
  }
};
soundController.stopStreaming = function () {
  if (soundController.streaming === true) {
    console.log('[:] Stop streaming');
    soundController.streaming = false;
    soundController.stream.end();
  }
};
soundController.playCache = function (cache) {
  while (cache.length) {
    var buffer    = cache.shift();
    var source    = soundController.speakerContext.createBufferSource();
    source.buffer = buffer;
    source.connect(soundController.speakerContext.destination);
    if (soundController.nextTime == 0) {
      // add a delay of 0.05 seconds
      soundController.nextTime = soundController.speakerContext.currentTime + 0.05;
    }
    source.start(soundController.nextTime);
    // schedule buffers to be played consecutively
    soundController.nextTime+=source.buffer.duration;
    //console.log('Playing cache:', soundController.nextTime);
  }
};

function setupCoachMedia() {
  soundController.streaming = false;
  soundController.device = navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  soundController.device.then(function (stream) {
    mediaStreamCoach = stream;
    // map the camera
    //var video = document.getElementById('live_video');
    //video.src = window.URL.createObjectURL(stream);
    //Stop echo
    //video.volume = 0;
    //video.muted = 0;
    // create the canvas & get a 2d context
    //window.videoCanvas = document.createElement('canvas');
    //window.videoContext = window.videoCanvas.getContext('2d');
    context = new AudioContext();
    var audioInput = context.createMediaStreamSource(stream);
    var bufferSize = 2048;
    // create a JS node
    soundController.streamer = context.createScriptProcessor(bufferSize, 1, 1);
    soundController.streamer.onaudioprocess = soundController.streamerProcess;
    audioInput.connect(soundController.streamer);
    soundController.streamer.connect(context.destination);
    console.log('>:< Audio connected');
    // connect to Recorder
    audioRecorder = new Recorder(audioInput);
    recorderSetup = true;
    console.log('>:< Recorder connected');
  });
  soundController.device.catch(function (err) {
    console.log("The following error occured: ", err);
  });
  console.log('>:< Coach Setup');
}

function setupTraineeMedia() {
  soundController.speakerContext = new AudioContext();
  client.on('stream', function (stream) {
    soundController.nextTime = 0;
    var init = false;
    var audioCache = [];
    console.log('|:> Receiving audio stream');
    stream.on('data', function (data) {
      var array = new Float32Array(data);
      var buffer = soundController.speakerContext.createBuffer(1, 2048, 44100);
      buffer.copyToChannel(array, 0);
      audioCache.push(buffer);
      // make sure we put at least 5 chunks in the buffer before starting
      if ((init === true) || ((init === false) && (audioCache.length > 15))) {
        init = true;
        soundController.playCache(audioCache);
      }
    });
    stream.on('end', () => { console.log('[:] Stopped audio stream'); });
  });
}

function usrid() {
  if(!!Meteor.userId()) {
    Session.set('usrid', Meteor.user().emails[0].address);
  } else {
    if (!Session.get('usrid')) {
      Session.set('usrid', Math.random().toString().split('.')[1] + '@veecaster.com');
    }
  }
  return Session.get('usrid');
}
function fllnm() {
  if(!!Meteor.userId()) {
    Session.set('fllnm', `${Meteor.user().profile.fname} ${Meteor.user().profile.lname}`);
  } else {
    if (!Session.get('fllnm')) {
      Session.set('fllnm', 'Anonymous Trainee');
    }
  }
  return Session.get('fllnm');
}

Template.livecs.helpers({
  messages: () => { return Session.get('chtmsgs'); },
  havemsgs: () => { return Session.get('chtmsgs').length > 0; },
  human: (dte = new Date()) => { return moment(+dte).fromNow(); },
  semid: (id) => { return Session.get('semid'); },
  semnm: () => {
    let sem = Seminars.findOne({ _id: Session.get('semid') });
    return sem && sem.name || "Veecaster Teleseminar";
  },
  sgnin: () => { return Meteor.loggingIn(); },
  sgdin: () => { return !!Meteor.user(); },
  usrnm: (email = 'anonymous@gmail.com') => { return email.split('@')[0]; },
  usrid: usrid,
  fllnm: fllnm,
  ownmsg: (msg) => { return msg.uid == usrid(); },
  supportsMedia: supportsMedia,
  isCoach: () => { return FlowRouter.getParam('coach') === Meteor.userId(); }
});

Template.livecs.events({
  'click .telestarter': function(evt, tpl) {
    evt.preventDefault();
    tpl.find('#telestopper').style.display = 'block';
    tpl.find('#telestarter').style.display = 'none';
    //startRecording();
    soundController.startStreaming();
  },
  'click .telestopper': function(evt, tpl) {
    evt.preventDefault();
    tpl.find('#telestopper').style.display = 'none';
    tpl.find('#telestarter').style.display = 'block';
    //completeRecording();
    soundController.stopStreaming();
  },
  'click #btnchat': function(evt, tpl) {
    evt.preventDefault();
    insmsg( Session.get('semid'),
            tpl.find('#txtchat').value,
            fllnm(), usrid(), tpl);
    return false;
  },
  'keyup #txtchat': function(evt, tpl) {
    if(evt.which === 13) {
      evt.preventDefault();
      insmsg( Session.get('semid'),
              tpl.find('#txtchat').value,
              fllnm(), usrid(), tpl);
      return false;
    }
  }
});

Template.livecs.onRendered(function() {
  $('.menu .item').tab();
  let lk = window.location,
      url = 'http://jsonplaceholder.typicode.com/posts';
  client = new BinaryClient((lk.protocol==='http:' && 'ws:' || 'wss:') + '//' + lk.hostname + ':9000');
  if (FlowRouter.getParam('coach') === Meteor.userId()) {
    this.find('#uploading').style.display = 'none';
    this.find('#uploaded').style.display = 'none';
    this.find('#telestopper').style.display = 'none';
    this.find('#telestarter').style.display = 'block';
    setupCoachMedia();
    console.log('>:< Coach online');
  } else {
    setupTraineeMedia();
    console.log('>:< Trainee online');
  }
  HTTP.call('GET', url, {}, (err, res) => { console.log( err && err || res ); });
});

function rfrshMsgs(n = 5) {
  Session.set('chtmsgs', Messages.find({}, { order: { dte: -1 }, limit: n }).fetch().reverse());
}
window.rfrshTwts = function (opts) {
  Meteor.call('getTweets',
              { sem: opts.sem, scr: opts.scr.split('@')[1] },
              (error) => {
                console.log(error && error || 'Success');
              });
}

Template.livecs.onCreated(function() {
  if (!Meteor.userId && !Session.get('usrid')) {
    //Session.set('usrid', Math.random().toString().split('.')[1] + '@veecaster.com');
    console.log('>:< empty trainee');
  }
  Session.setDefault('chtmsgs', []);
  this.autorun(() => {
    if (!!Meteor.user()) { usrid(); fllnm(); }
    Session.set('chtmsgs', Messages.find({}, { sort: { dte: -1 }, limit: 5 }).fetch().reverse());
    this.subscribe('messages', Session.get('semid'));
    this.subscribe('seminar', Session.get('semid'));
    this.subscribe('tweets', Session.get('semid'));
  });
});
