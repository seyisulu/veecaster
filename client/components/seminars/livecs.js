//import Recorder from '../../lib/recorder-js/recorder';

let insmsg = (sem, msg, usr, uid, tpl) => {
  Messages.insert({
    sem: sem,
    msg: msg,
    usr: usr,
    uid: uid,
    cch: Meteor.userId(),
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

var Visualizer = function() {
  var tileSize;
  var tiles = [];
  var stars = [];
  var container;
  // canvas vars
  var fgCanvas;
  var fgCtx;
  var fgRotation = 0.001;
  var bgCanvas;
  var bgCtx;
  var sfCanvas;
  var sfCtx;
  var audioSource;

  function Polygon(sides, x, y, tileSize, ctx, num) {
    this.sides = sides;
    this.tileSize = tileSize;
    this.ctx = ctx;
    this.num = num; // the number of the tile, starting at 0
    this.high = 0; // the highest colour value, which then fades out
    this.decay = this.num > 42 ? 1.5 : 2; // increase this value to fade out faster.
    this.highlight = 0; // for highlighted stroke effect;
    // figure out the x and y coordinates of the center of the polygon based on the
    // 60 degree XY axis coordinates passed in
    var step = Math.round(Math.cos(Math.PI/6)*tileSize*2);
    this.y = Math.round(step * Math.sin(Math.PI/3) * -y  );
    this.x = Math.round(x * step + y * step/2 );

    // calculate the vertices of the polygon
    this.vertices = [];
    for (var i = 1; i <= this.sides;i += 1) {
      x = this.x + this.tileSize * Math.cos(i * 2 * Math.PI / this.sides + Math.PI/6);
      y = this.y + this.tileSize * Math.sin(i * 2 * Math.PI / this.sides + Math.PI/6);
      this.vertices.push([x, y]);
    }
  }
  Polygon.prototype.rotateVertices = function() {
    // rotate all the vertices to achieve the overall rotational effect
    var rotation = fgRotation;
    rotation -= audioSource.volume > 10000 ? Math.sin(audioSource.volume/800000) : 0;
    for (var i = 0; i <= this.sides-1;i += 1) {
      this.vertices[i][0] = this.vertices[i][0] -  this.vertices[i][1] * Math.sin(rotation);
      this.vertices[i][1] = this.vertices[i][1] +  this.vertices[i][0] * Math.sin(rotation);
    }
  };
  var minMental = 0, maxMental = 0;
  Polygon.prototype.calculateOffset = function(coords) {
    var angle = Math.atan(coords[1]/coords[0]);
    var distance = Math.sqrt(Math.pow(coords[0], 2) + Math.pow(coords[1], 2)); // a bit of pythagoras
    var mentalFactor = Math.min(Math.max((Math.tan(audioSource.volume/6000) * 0.5), -20), 2); // this factor makes the visualization go crazy wild
    /*
    // debug
    minMental = mentalFactor < minMental ? mentalFactor : minMental;
     maxMental = mentalFactor > maxMental ? mentalFactor : maxMental;*/
    var offsetFactor = Math.pow(distance/3, 2) * (audioSource.volume/2000000) * (Math.pow(this.high, 1.3)/300) * mentalFactor;
    var offsetX = Math.cos(angle) * offsetFactor;
    var offsetY = Math.sin(angle) * offsetFactor;
    offsetX *= (coords[0] < 0) ? -1 : 1;
    offsetY *= (coords[0] < 0) ? -1 : 1;
    return [offsetX, offsetY];
  };
  Polygon.prototype.drawPolygon = function() {
    var bucket = Math.ceil(audioSource.streamData.length/tiles.length*this.num);
    var val = Math.pow((audioSource.streamData[bucket]/255),2)*255;
    val *= this.num > 42 ? 1.1 : 1;
    // establish the value for this tile
    if (val > this.high) {
      this.high = val;
    } else {
      this.high -= this.decay;
      val = this.high;
    }

    // figure out what colour to fill it and then draw the polygon
    var r, g, b, a;
    if (val > 0) {
      this.ctx.beginPath();
      var offset = this.calculateOffset(this.vertices[0]);
      this.ctx.moveTo(this.vertices[0][0] + offset[0], this.vertices[0][1] + offset[1]);
      // draw the polygon
      for (var i = 1; i <= this.sides-1;i += 1) {
        offset = this.calculateOffset(this.vertices[i]);
        this.ctx.lineTo (this.vertices[i][0] + offset[0], this.vertices[i][1] + offset[1]);
      }
      this.ctx.closePath();

      if (val > 128) {
        r = (val-128)*2;
        g = ((Math.cos((2*val/128*Math.PI/2)- 4*Math.PI/3)+1)*128);
        b = (val-105)*3;
      }
      else if (val > 175) {
        r = (val-128)*2;
        g = 255;
        b = (val-105)*3;
      }
      else {
        r = ((Math.cos((2*val/128*Math.PI/2))+1)*128);
        g = ((Math.cos((2*val/128*Math.PI/2)- 4*Math.PI/3)+1)*128);
        b = ((Math.cos((2.4*val/128*Math.PI/2)- 2*Math.PI/3)+1)*128);
      }
      if (val > 210) {
        this.cubed = val; // add the cube effect if it's really loud
      }
      if (val > 120) {
        this.highlight = 100; // add the highlight effect if it's pretty loud
      }
      // set the alpha
      var e = 2.7182;
      a = (0.5/(1 + 40 * Math.pow(e, -val/8))) + (0.5/(1 + 40 * Math.pow(e, -val/20)));

      this.ctx.fillStyle = "rgba(" +
        Math.round(r) + ", " +
        Math.round(g) + ", " +
        Math.round(b) + ", " +
        a + ")";
      this.ctx.fill();
      // stroke
      if (val > 20) {
        var strokeVal = 20;
        this.ctx.strokeStyle =  "rgba(" + strokeVal + ", " + strokeVal + ", " + strokeVal + ", 0.5)";
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    }
    // display the tile number for debug purposes
    /*this.ctx.font = "bold 12px sans-serif";
     this.ctx.fillStyle = 'grey';
     this.ctx.fillText(this.num, this.vertices[0][0], this.vertices[0][1]);*/
  };
  Polygon.prototype.drawHighlight = function() {
    this.ctx.beginPath();
    // draw the highlight
    var offset = this.calculateOffset(this.vertices[0]);
    this.ctx.moveTo(this.vertices[0][0] + offset[0], this.vertices[0][1] + offset[1]);
    // draw the polygon
    for (var i = 0; i <= this.sides-1;i += 1) {
      offset = this.calculateOffset(this.vertices[i]);
      this.ctx.lineTo (this.vertices[i][0] + offset[0], this.vertices[i][1] + offset[1]);
    }
    this.ctx.closePath();
    var a = this.highlight/100;
    this.ctx.strokeStyle =  "rgba(255, 255, 255, " + a + ")";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.highlight -= 0.5;
  };

  var makePolygonArray = function() {
    tiles = [];
    /**
     * Arrange into a grid x, y, with the y axis at 60 degrees to the x, rather than
     * the usual 90.
     * @type {number}
     */
    var i = 0; // unique number for each tile
    tiles.push(new Polygon(6, 0, 0, tileSize, fgCtx, i)); // the centre tile
    i++;
    for (var layer = 1; layer < 7; layer++) {
      tiles.push(new Polygon(6, 0, layer, tileSize, fgCtx, i)); i++;
      tiles.push(new Polygon(6, 0, -layer, tileSize, fgCtx, i)); i++;
      for(var x = 1; x < layer; x++) {
        tiles.push(new Polygon(6, x, -layer, tileSize, fgCtx, i)); i++;
        tiles.push(new Polygon(6, -x, layer, tileSize, fgCtx, i)); i++;
        tiles.push(new Polygon(6, x, layer-x, tileSize, fgCtx, i)); i++;
        tiles.push(new Polygon(6, -x, -layer+x, tileSize, fgCtx, i)); i++;
      }
      for(var y = -layer; y <= 0; y++) {
        tiles.push(new Polygon(6, layer, y, tileSize, fgCtx, i)); i++;
        tiles.push(new Polygon(6, -layer, -y, tileSize, fgCtx, i)); i++;
      }
    }
  };

  function Star(x, y, starSize, ctx) {
    this.x = x;
    this.y = y;
    this.angle = Math.atan(Math.abs(y)/Math.abs(x));
    this.starSize = starSize;
    this.ctx = ctx;
    this.high = 0;
  }
  Star.prototype.drawStar = function() {
    var distanceFromCentre = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));

    // stars as lines
    var brightness = 200 + Math.min(Math.round(this.high * 5), 55);
    this.ctx.lineWidth= 0.5 + distanceFromCentre/2000 * Math.max(this.starSize/2, 1);
    this.ctx.strokeStyle='rgba(' + brightness + ', ' + brightness + ', ' + brightness + ', 1)';
    this.ctx.beginPath();
    this.ctx.moveTo(this.x,this.y);
    var lengthFactor = 1 + Math.min(Math.pow(distanceFromCentre,2)/30000 * Math.pow(audioSource.volume, 2)/6000000, distanceFromCentre);
    var toX = Math.cos(this.angle) * -lengthFactor;
    var toY = Math.sin(this.angle) * -lengthFactor;
    toX *= this.x > 0 ? 1 : -1;
    toY *= this.y > 0 ? 1 : -1;
    this.ctx.lineTo(this.x + toX, this.y + toY);
    this.ctx.stroke();
    this.ctx.closePath();

    // starfield movement coming towards the camera
    var speed = lengthFactor/20 * this.starSize;
    this.high -= Math.max(this.high - 0.0001, 0);
    if (speed > this.high) {
      this.high = speed;
    }
    var dX = Math.cos(this.angle) * this.high;
    var dY = Math.sin(this.angle) * this.high;
    this.x += this.x > 0 ? dX : -dX;
    this.y += this.y > 0 ? dY : -dY;

    var limitY = fgCanvas.height/2 + 500;
    var limitX = fgCanvas.width/2 + 500;
    if ((this.y > limitY || this.y < -limitY) || (this.x > limitX || this.x < -limitX)) {
      // it has gone off the edge so respawn it somewhere near the middle.
      this.x = (Math.random() - 0.5) * fgCanvas.width/3;
      this.y = (Math.random() - 0.5) * fgCanvas.height/3;
      this.angle = Math.atan(Math.abs(this.y)/Math.abs(this.x));
    }
  };

  var makeStarArray = function() {
    var x, y, starSize;
    stars = [];
    var limit = fgCanvas.width / 15; // how many stars?
    for (var i = 0; i < limit; i ++) {
      x = (Math.random() - 0.5) * fgCanvas.width;
      y = (Math.random() - 0.5) * fgCanvas.height;
      starSize = (Math.random()+0.1)*3;
      stars.push(new Star(x, y, starSize, sfCtx));
    }
  };

  var drawBg = function() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    var r, g, b, a;
    var val = audioSource.volume/1000;
    r = 200 + (Math.sin(val) + 1) * 28;
    g = val * 2;
    b = val * 8;
    a = Math.sin(val+3*Math.PI/2) + 1;
    bgCtx.beginPath();
    bgCtx.rect(0, 0, bgCanvas.width, bgCanvas.height);
    // create radial gradient
    var grd = bgCtx.createRadialGradient(
      bgCanvas.width/2, bgCanvas.height/2, val, bgCanvas.width/2, bgCanvas.height/2,
      bgCanvas.width-Math.min(Math.pow(val, 2.7), bgCanvas.width - 20));
    grd.addColorStop(0, 'rgba(0,0,0,0)');// centre is transparent black
    grd.addColorStop(0.8, "rgba(" +
      Math.round(r) + ", " +
      Math.round(g) + ", " +
      Math.round(b) + ", 0.4)"); // edges are reddish

    bgCtx.fillStyle = grd;
    bgCtx.fill();
    /*
     // debug data
     bgCtx.font = "bold 30px sans-serif";
     bgCtx.fillStyle = 'grey';
     bgCtx.fillText("val: " + val, 30, 30);
     bgCtx.fillText("r: " + r , 30, 60);
     bgCtx.fillText("g: " + g , 30, 90);
     bgCtx.fillText("b: " + b , 30, 120);
     bgCtx.fillText("a: " + a , 30, 150);*/
  };

  this.resizeCanvas = function() {

    if (fgCanvas) {
      // resize the foreground canvas
      fgCanvas.width = container.clientWidth;
      fgCanvas.height = container.clientHeight;
      fgCtx.translate(fgCanvas.width/2,fgCanvas.height/2);

      // resize the bg canvas
      bgCanvas.width = container.clientWidth;
      bgCanvas.height = container.clientHeight;
      // resize the starfield canvas
      sfCanvas.width = container.clientWidth;
      sfCanvas.height = container.clientHeight;
      sfCtx.translate(fgCanvas.width/2,fgCanvas.height/2);

      tileSize = fgCanvas.width > fgCanvas.height ? fgCanvas.width / 25 : fgCanvas.height / 25;

      drawBg();
      makePolygonArray();
      makeStarArray()
    }
  };

  var rotateForeground = function() {
    tiles.forEach(function(tile) {
      tile.rotateVertices();
    });
  };

  var draw = function() {
    fgCtx.clearRect(-fgCanvas.width, -fgCanvas.height, fgCanvas.width*2, fgCanvas.height *2);
    sfCtx.clearRect(-fgCanvas.width/2, -fgCanvas.height/2, fgCanvas.width, fgCanvas.height);

    stars.forEach(function(star) {
      star.drawStar();
    });
    tiles.forEach(function(tile) {
      tile.drawPolygon();
    });
    tiles.forEach(function(tile) {
      if (tile.highlight > 0) {
        tile.drawHighlight();
      }
    });

    // debug
    /* fgCtx.font = "bold 24px sans-serif";
     fgCtx.fillStyle = 'grey';
     fgCtx.fillText("minMental:" + minMental, 10, 10);
     fgCtx.fillText("maxMental:" + maxMental, 10, 40);*/
    requestAnimationFrame(draw);
  };

  this.init = function(options) {
    audioSource = options.audioSource;
    container = document.getElementById(options.containerId);

    // foreground hexagons layer
    fgCanvas = document.createElement('canvas');
    fgCanvas.setAttribute('style', 'position: absolute; z-index: 10');
    fgCtx = fgCanvas.getContext("2d");
    container.appendChild(fgCanvas);

    // middle starfield layer
    sfCanvas = document.createElement('canvas');
    sfCtx = sfCanvas.getContext("2d");
    sfCanvas.setAttribute('style', 'position: absolute; z-index: 5');
    container.appendChild(sfCanvas);

    // background image layer
    bgCanvas = document.createElement('canvas');
    bgCtx = bgCanvas.getContext("2d");
    container.appendChild(bgCanvas);

    makePolygonArray();
    makeStarArray();

    this.resizeCanvas();
    draw();

    setInterval(drawBg, 100);
    setInterval(rotateForeground, 20);
    // resize the canvas to fill browser window dynamically
    window.addEventListener('resize', this.resizeCanvas, false);
  };
};//Visualizer

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
// cross-browser Multimedia query
function supportsMedia() {
  return !!(navigator.getUserMedia              ||
            navigator.webkitGetUserMedia        ||
            navigator.mozGetUserMedia           ||
            navigator.msGetUserMedia);
}
// cross-browser support for getUserMedia
navigator.getUserMedia =  navigator.getUserMedia        ||
                          navigator.webkitGetUserMedia  ||
                          navigator.mozGetUserMedia     ||
                          navigator.msGetUserMedia;
navigator.mediaDevices = navigator.mediaDevices ||
   (navigator.getUserMedia ? {
     getUserMedia: function(c) {
       return new Promise(function(y, n) {
         navigator.getUserMedia.call(navigator, c, y, n);
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
var soundController = {},
    client, context, counter = 0,
    mediaStreamCoach, audioRecorder,
    recorderSetup, audioAnalyzerHub = {};
soundController.streamerProcess = function (e) {
  var left = e.inputBuffer.getChannelData(0);
  if (soundController.streaming === true) {
    soundController.stream.write(left);
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
    var buffer    = cache.shift(),
        source    = soundController.speakerContext.createBufferSource(),
        gainnd    = soundController.speakerContext.createGain();
    source.buffer = buffer;
    source.connect(gainnd);
    gainnd.connect(soundController.speakerContext.destination);
    gainnd.gain.value = 0.9;
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
  //soundController.device = navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  //soundController.device.then
  navigator.getUserMedia({ audio: true, video: false }, function (stream) {
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
    var audioAnalyzer = context.createAnalyser();

    var bufferSize = 2048;
    // create a JS node
    soundController.streamer = context.createScriptProcessor(bufferSize, 1, 1);
    soundController.streamer.onaudioprocess = soundController.streamerProcess;
    audioInput.connect(soundController.streamer);
    soundController.streamer.connect(context.destination);
    console.log('>:< Audio connected');
    // connect source to Analyser
    audioAnalyzer.fftSize = 256;
    audioInput.connect(audioAnalyzer);
    // This just means we will have 128 "bins"
    // (always half the analyzer.fftsize value),
    // each containing a number between 0 and 255.
    audioAnalyzerHub.streamData = new Uint8Array(128);
    audioAnalyzerHub.volume = 0;
    var audioStreamSampler = function() {
      audioAnalyzer.getByteFrequencyData(audioAnalyzerHub.streamData);
      var total = 0;
      for (var i = 0; i < 80; i++) {
        // get the volume from the first 80 bins only,
        // else it gets too loud with treble
        total += audioAnalyzerHub.streamData[i];
      }
      audioAnalyzerHub.volume = total > 10200? 99: Math.floor(total / 10200 * 100);
      Session.set('audioAnalyzerHub.volume', audioAnalyzerHub.volume);
    };
    setInterval(audioStreamSampler, 250);
    /*
    var canvasElement = document.getElementById('audispec'),
        canvasContext = canvasElement.getContext("2d"),
        maxBin = 40;
    canvasElement.height = canvasElement.clientHeight;
    canvasElement.width = canvasElement.clientWidth;

    audioAnalyzerHub.draw = function() {
      let barWidth = Math.ceil(canvasElement.clientWidth / maxBin),//audioAnalyzerHub.streamData.length
          barHeight = canvasElement.clientHeight,
          colorFunc = (val) => { return `rgb(${val},0,0)`; };
      canvasContext.clearRect(0, 0, canvasElement.clientWidth, canvasElement.clientHeight);
      for(var bin = 0; bin < maxBin; bin++) {
        var val = audioAnalyzerHub.streamData[bin];
        canvasContext.fillStyle = colorFunc(val);
        canvasContext.fillRect(bin * barWidth, 0, barWidth, val);
      }
      requestAnimationFrame(audioAnalyzerHub.draw);
    };
    audioAnalyzerHub.draw();
    */

    var visualizer = new Visualizer();
    visualizer.init({
      containerId: 'visualizer',
      audioSource: audioAnalyzerHub
    });

    console.log('>:< Analyzer connected');
    // connect to Recorder
    //audioRecorder = new Recorder(audioInput);
    audioRecorder = new WebAudioRecorder(audioInput, {
      workerDir: "/recjs/",
      encoding: "mp3"
    });
    audioRecorder.onEncoderLoading = function(rec, encoder) {
      console.log('>:< MP3 Encoader Loading');
    };
    audioRecorder.onEncoderLoaded = function(rec, encoding) {
      console.log('>:< MP3 Encoader Loaded');
    };
    audioRecorder.onComplete = function(recorder, blob) {
      document.getElementById('vc-a-save').href = window.URL.createObjectURL(blob);
      document.getElementById('vc-a-save').download = `${Session.get('semid')+'-'+Date.now()}.mp3`;
    };
    audioRecorder.onError = function(rec, message) {
      console.log(message);
    };
    recorderSetup = true;
    console.log('>:< Recorder connected');
    console.log('>:< This coach is ready to roll...');
  },
  function (e) {
    veeMsg('Microphone not initialized!');
    console.log(e);
  });
  /*
  soundController.device.catch(function (err) {
    console.log("The following error occured: ", err);
  });
  */
  console.log('>:< Coach Setup');
}

function setupTraineeMedia() {
  soundController.speakerContext = new AudioContext();
  client.on('stream', function (stream) {
    document.getElementById('vstreaming').style.display = 'block';
    soundController.nextTime = 0;
    var init = false;
    var audioCache = [];
    console.log('>:> Receiving audio stream');
    stream.on('data', function (data) {
      var array = new Float32Array(data);//44100
      var buffer = soundController.speakerContext.createBuffer(1, 2048, 48000);
      buffer.copyToChannel(array, 0);
      audioCache.push(buffer);
      // make sure we put at least 5 chunks in the buffer before starting
      if ((init === true) || ((init === false) && (audioCache.length > 15))) {
        init = true;
        soundController.playCache(audioCache);
      }
    });
    stream.on('end', () => {
      document.getElementById('vstreaming').style.display = 'none';
      console.log(']:[ Stopped audio stream');
    });
  });
}

function startRecording() {
  if(!recorderSetup) {
    setupCoachMedia();
  }
  console.log(">:< Recording Started");
  //audioRecorder.record();
  document.getElementById('uploading').style.display = 'none';
  document.getElementById('uploaded').style.display = 'none';
  audioRecorder.startRecording();
}

function completeRecording() {
  //audioRecorder.stop();
  document.getElementById('uploading').style.display = 'none';
  document.getElementById('uploaded').style.display = 'block';
  audioRecorder.finishRecording();
  console.log(">:< Recording stopped.");
  /*
  document.getElementById('uploading').style.display = 'block';
  audioRecorder.exportWAV(function (audioBlob) {
    document.getElementById('uploading').style.display = 'none';
    document.getElementById('uploaded').style.display = 'block';
    document.getElementById('vc-a-save').href = window.URL.createObjectURL(audioBlob);
    document.getElementById('vc-a-save').download = `${Session.get('semid')+'-'+Date.now()}.wav`;
 		audioRecorder.clear();
  });
  */
  veeMsg('Audio sucessfully recorded.');
  //mediaStream.stop();
  //FlowRouter.go('/app/seminars');
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
  twts: () => { return Session.get('vtweets'); },
  usrimg: (usr) => { return usr.profile_image_url_https; },
  coached: (cch) => { return cch == Session.get('coach')? '<i class="angle double up green icon"></i>':''; },
  havetwts: () => { return Session.get('vtweets').length > 0; },
  messages: () => { return Session.get('chtmsgs'); },
  havemsgs: () => { return Session.get('chtmsgs').length > 0; },
  human: (dte = new Date()) => { return moment(+dte).fromNow(); },
  semid: (id) => { return Session.get('semid'); },
  semnr: () => { return Seminars.findOne({ _id: Session.get('semid') }); },
  sgnin: () => { return Meteor.loggingIn(); },
  sgdin: () => { return !!Meteor.user(); },
  usrnm: (email = 'anonymous@gmail.com') => { return email.split('@')[0]; },
  usrid: usrid,
  fllnm: fllnm,
  ownmsg: (msg) => { return msg.uid == usrid(); },
  volume: (msg) => { return Session.get('audioAnalyzerHub.volume'); },
  twtusr: (usr) => { return usr.screen_name; },
  supportsMedia: supportsMedia,
  isCoach: () => { return FlowRouter.getParam('coach') === Meteor.userId(); },
  pdfurl: (id) => {
    let pdf = PDFs.collection.findOne({ _id: id });
    return (pdf && pdf.meta) && pdf.meta.pipeFrom || "";
  },
  veepdf: (pdf) => {
    let lk = window.location,
        hn = lk.host;
    return `http://${hn}/cdn/storage/pdfs/${pdf._id}/original/${pdf._id}.pdf`;
  },
  veebox: (pdf) => {
    if (!pdf && !pdf.meta && !pdf.meta.pipeFrom) {
      return '';
    }
    return pdf.meta.pipeFrom.split('?')[0];
  },
  pdfobj: () => {
    let sem = Seminars.findOne({ _id: Session.get('semid') });
    return PDFs.collection.findOne({ _id: sem && sem.pdf.id || '' });
  },
  shwpdf: (url) => {
    /*
    PDFJS.workerSrc = '/packages/pascoual_pdfjs/build/pdf.worker.js';
    PDFJS.getDocument('https://pdfobject.com/pdf/sample-3pp.pdf')
         .then(function getPdfHelloWorld(pdf) {
      console.log('>:< Gotten!');
    	// Fetch the first page
    	pdf.getPage(1).then(function getPageHelloWorld(page) {
    		var scale = 1;
    		var viewport = page.getViewport(scale);
    		// Prepare canvas using PDF page dimensions
    		var canvas = document.getElementById('pdfcanvas');
    		var context = canvas.getContext('2d');
    		canvas.height = viewport.height;
    		canvas.width = viewport.width;
    		// Render PDF page into canvas context
    		page.render({canvasContext: context, viewport: viewport}).promise.then(function () {
    			console.log('>:< Rendered');
    		});
    	});
    });
    */
  }
});

Template.livecs.events({
  'click .telestarter': function(evt, tpl) {
    evt.preventDefault();
    tpl.find('#telestopper').style.display = 'block';
    tpl.find('#telestarter').style.display = 'none';
    startRecording();
    soundController.startStreaming();
  },
  'click .telestopper': function(evt, tpl) {
    evt.preventDefault();
    tpl.find('#telestopper').style.display = 'none';
    tpl.find('#telestarter').style.display = 'block';
    completeRecording();
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
  let lk = window.location, wk = lk.hostname,
      bh = Meteor.settings.public.veecaster.binsrvhost,
      bp = Meteor.settings.public.veecaster.binsrvport,
      bs = Meteor.settings.public.veecaster.binsrvpssl,
      bl = Meteor.settings.public.veecaster.binsrvlocl;
  if (lk.hostname === "localhost") {
    client = new BinaryClient(`ws://${bh}:${bl}`);
  } else {
    //client = new BinaryClient((lk.protocol==='http:') && `ws://${wk}:${bp}` || `wss://${wk}:${bs}`);
    client = new BinaryClient(`ws://${wk}:${bp}`);
  }
  if (FlowRouter.getParam('coach') === Meteor.userId()) {
    this.find('#uploading').style.display = 'none';
    this.find('#uploaded').style.display = 'none';
    this.find('#telestopper').style.display = 'none';
    this.find('#telestarter').style.display = 'block';
    setupCoachMedia();
    console.log('>:< Coach online');
  } else {
    this.find('#vstreaming').style.display = 'none';
    setupTraineeMedia();
    console.log('>:< Trainee online');
  }
});

var rfrshTwtsInt,
    rfrshMsgs = function(n = 5) {
      Session.set('chtmsgs', Messages.find({}, { order: { dte: -1 }, limit: n }).fetch().reverse());
    },
    rfrshTwts = function(n = 5) {
      if (!Meteor.user()) {
        return -1;
      }
      let scr = Meteor.user().profile.twittr;
      Meteor.call('getTweets',
                  { sem: Session.get('semid'), scr: scr.split('@')[1], n: n },
                  function(error) {
                    console.log(error && error || '>:< Tweets Refreshed');
                  });
    };

window.rfrshTwts = rfrshTwts;

Template.livecs.onCreated(function() {
  Session.setDefault('chtmsgs', []);
  Session.setDefault('vtweets', []);
  Session.setDefault('audioAnalyzerHub.volume', 0);
  this.autorun(() => {
    if (!!Meteor.user()) { usrid(); fllnm(); }
    Session.set('chtmsgs', Messages.find({}, { sort: { dte: -1 }, limit: 5 }).fetch().reverse());
    let twtz = Tweets.findOne({ sem: Session.get('semid') });
    Session.set('vtweets', twtz && twtz.twt || []);
    this.subscribe('messages', Session.get('semid'));
    this.subscribe('seminar', Session.get('semid'));
    this.subscribe('tweets', Session.get('semid'));
    $('#mic-volume').progress({ percent: Session.get('audioAnalyzerHub.volume'), autoSuccess: false });
  });
  if (Meteor.userId()) {
    rfrshTwts();
    rfrshTwtsInt = Meteor.setInterval(rfrshTwts, 60 * 1000);
  }
});

Template.livecs.onDestroyed(function() {
  clearInterval(rfrshTwtsInt);
});
