Meteor.methods({
  'getICEServers': function() {
    return { 'iceServers': [
      { 
        url: 'turn:veecaster.com', 
        credential: 'ChocolateyCast3r', 
        username: 'vee' 
      }
    ]};
  },
  'getICEServersPlus': function() {
    return [
        { url:'stun:stun.l.google.com:19302' }, 
        { 
          url: 'turn:numb.viagenie.ca', 
          credential: 'Chocolat3y', 
          username: 'eolowo@veecaster.com' 
        },
        { 
          urls: [
            'turn:veecaster.com:3478?transport=udp',
            'turn:veecaster.com:3478?transport=tcp',
            'turns:veecaster.com:5349?transport=tcp'
            ], 
          username: 'vee', 
          credential: 'ChocolateyCast3r'
        }
      ];
  },
  'getDICEServers': function(usrnm) { //Dynamic (ephemeral) credentials
    var tomorrowTS = Math.floor(Date.now() / 1000) + (24*60*60);
    var cplxUsrnm = usrnm + ':' + tomorrowTS;
    var pwd = 
      CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(
      CryptoJS.HmacSHA1(cplxUsrnm, 'chocolate').toString()));
    return { 'iceServers': [
      { 
        url: 'turn:veecaster.com', 
        credential: pwd, 
        username: cplxUsrnm
      }
    ]};
  },
  'getPJKey': function() {
    return { key:'4sknyp3axl1pp66r' };
  }
});