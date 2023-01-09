//Utility Functions /////////////////////////////////////////////////////////////////////

/*
 * Header adds a Content-Type header to the response indicating that all output
 * will be json formatted.
 */
function header(res) {
  res.writeHead(200, {
      'Content-Type': 'application/json'
  });
}

/* 
 * Wrap is a utility function for implementing jsonp, a method (basically hack)
 * for doing cross-domain calls. 
 * See: http://en.wikipedia.org/wiki/JSONP
 * See: http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
 */
function wrap(txt, callb) {
  return callb + "(" + txt + ")";
}

function errorLog(fcn, ctx, e) {
  console.log(fcn + ': Error on input (' + ctx + ') ' + e.toString());
}

function log(ipaddr, id, message) {
  console.log(ipaddr + "(" + id + "): " + message);
}

//Player Functions /////////////////////////////////////////////////////////////////////

//Player class constructor
var Player = function (login) {
  this.player = login;
  this.dist = 0;
  this.death = 0;
  this.winner = false;
}

//PlayerList class constructor
var PlayerList = function () {
  this.players = new Array();
};

//return player ID given name, else 0
PlayerList.prototype.getId = function (name) {
  for (var i = 0; i < this.players.length; ++i) {
      if (this.players[i].player === name) {
          return i + 1;
      }
  }
  return 0;
};

//add Player to PlayerList
PlayerList.prototype.add = function (player) {
  this.players.push(player);
};

//GET FROM CLIENT SIDE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//update distance of given player
PlayerList.prototype.updateDist = function (id, distance) {
  if(distance > this.players[id - 1].dist ){
    this.players[id - 1].dist = distance;
  }
};

//NEEDS WORK !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//check to see if all players ready (now majority)
PlayerList.prototype.isVoteOk = function (field) {
  var vote = 0;
  this.players.forEach(function (elem, index, obj) {
      if (elem[field])
          ++vote;
  });
  return vote * 2 == this.players.length;
};

//check winner with longest distance, and reset all others
PlayerList.prototype.setWinner = function () {
  var hi = -1;
  var winner = -1;
  for (var i = 0; i < this.players.length; ++i) {
      if (this.players[i].dist > hi) {
          hi = this.players[i].dist;
          winner = i;
      }
  }
  if (winner > -1) {
      for (var j = 0; j < this.players.length; ++j) {
          if (j === winner)
              this.players[j].winner = true;
          else
              this.players[j].winner = false;
      }
  }
};

// Resets the votes for all players.
PlayerList.prototype.resetField = function (field) {
  this.players.forEach(function (elem, index, obj) {
      elem[field] = 0;
  });
};

//debug functions /////////////////////////////////////

//return number of players
PlayerList.prototype.length = function () {
  return this.players.length;
};

//check if player on list given ID
PlayerList.prototype.onList = function (id) {
  return id > 0 && id <= this.players.length;
}

//return player obj given ID, else null
PlayerList.prototype.getPlayer = function (id) {
  var index = id - 1;
  if (index < 0 || index >= this.players.length) {
      return null;
  } else {
      return this.players[index];
  }
};

//Client Requests from AJAX calls /////////////////////////////////////////////////////////////////

var url = require('url');
var capyPlayers = new PlayerList();

//login processor - returns ID given name, and updates status
function processLogin(req, res) {
  var body = '';

  req.on('data', function (chunk) {
      body += chunk;
  });

  req.on('end', function () {
      header(res);

      var name = "";
      try {
          var ipaddr = req.connection.remoteAddress;
          var query = url.parse(req.url, true).query;
          var callback = query.callback;
          name = query.loginName;
          filteredName = name.replace(/[^a-zA-Z0-9 ]/g, "");
          if (filteredName.length <= 0) {
              log(ipaddr, 0, 'Login: Empty name rejected. (' + name + ")");
              var tmp = wrap(JSON.stringify(-1), callback);
              res.end(tmp);
          } 
          else {
              var id = capyPlayers.getId(filteredName);
              if (id > 0) {
                  log(ipaddr, id, 'Login: Relogin (' + filteredName + ')');
                  var tmp = wrap(JSON.stringify(id), callback);
                  res.end(tmp);
              }
              else {
                  capyPlayers.add(new Player(filteredName));
                  var index = capyPlayers.length();
                  log(ipaddr, index, 'Login: New login (' + filteredName + ')');
                  var tmp = wrap(JSON.stringify(index), callback);
                  clientList[ipaddr] = index;
                  res.end(tmp);
              }
            }
          updateStatus();
      } catch (e) {
          errorLog('processLogin error', body, e);
          var tmp = wrap(JSON.stringify(-1), callback);
          res.end(tmp);
      }

  });
}

//login name processor - returns name given ID
function processLoginName(req, res) {
  var body = '';
  req.on('data', function (chunk) {
      body += chunk;
  });
  req.on('end', function () {
      header(res);
      var id = 0;
      try {
          var ipaddr = req.connection.remoteAddress;
          var query = url.parse(req.url, true).query;
          var callback = query.callback;
          id = parseInt(query.id);

          if (id >= 1 && id <= capyPlayers.players.length) {
              var lname = capyPlayers.players[id - 1].player;
              log(ipaddr, id, 'Login Name Requested (' + lname + ')');
              var result = JSON.stringify(lname);
              var tmp = wrap(result, callback);
              res.end(tmp);
          } else {
              log(ipaddr, id, 'Login Name Rejected - Invalid id');
              var tmp = wrap(JSON.stringify("Error"), callback);
              res.end(tmp);
          }
      } catch (e) {
          errorLog('processLoginName', body, e);
          var tmp = wrap(JSON.stringify(false), callback);
          res.end(tmp);
      }
  });
}

//dead player processor - checks voting counts of dead players to end game, and updates status
function processDeath(req, res) {
  var body = '';
  req.on('data', function (chunk) {
      body += chunk;
  });
  req.on('end', function () {
      header(res);

      var id = 0;
      try {
          var ipaddr = req.connection.remoteAddress;
          var query = url.parse(req.url, true).query;
          var callback = query.callback;

          id = parseInt(query.id);
          if (capyPlayers.onList(id)) {
              log(ipaddr, id, 'Player '+id+' dead.');
              capyPlayers.updateDist(id, parseInt(query.distance));
              capyPlayers.players[id - 1].death += 1;

              /* check winners
              if (capyPlayers.isVoteOk("death")) {
                  capyPlayers.setWinner();
                  capyPlayers.resetField("death");
              }
              */

              updateStatus();
              var tmp = wrap(JSON.stringify(true), callback);
              res.end(tmp);
          } 
          else {
              log(ipaddr, id, 'End Game Rejected - Invalid id');
              var tmp = wrap(JSON.stringify(false), callback);
              res.end(tmp);
          }
      } catch (e) {
          errorLog('processEndGame', body, e);
          var tmp = wrap(JSON.stringify(false), callback);
          res.end(tmp);
      }

  });
}

//update status of PlayerList for all players
function updateStatus() {
  io.sockets.emit("players", capyPlayers.players);
}

//chat class constructor
var Chat = function () {
};

//send message to all players
Chat.sendAll = function (message) {
    io.sockets.emit("chat", message);
};
function processChat(req, res) {
  var body = '';
  var _this = this;

  req.on('data', function (chunk) {
      body += chunk;
  });

  req.on('end', function () {
      header(res);

      try {
          console.log("url = " + req.url);
          var query = url.parse(req.url, true).query;
          var callback = query.callback;
          var playerId = parseInt(query.id);
          var myPlayer = capyPlayers.getPlayer(playerId);
          var chatMessage = query.message;

          Chat.sendAll(myPlayer.player + ": " + chatMessage + "<br/>");

          var tmp = wrap(JSON.stringify(SUCCESS), callback);
          res.end(tmp);
      } catch (e) {
          errorLog('chat', body, e);
          var tmp = wrap(JSON.stringify(ERROR), callback);
          res.end(tmp);
      }
  });
}

//Initialize Server /////////////////////////////////////////////////////////////////////

//server properties
const PORT = 3333;
const DEBUG = 1;
const NOT_BEING_USED = -1;
const ERROR = -1;
const SUCCESS = 0;
const HOST = "127.0.0.1";

//initialize express
var http = require("http");
var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var app = express();
var publicPath = path.resolve(__dirname, "public");

//initialize server
app.use(express.static(publicPath));
app.use(bodyParser.urlencoded({ extended: false }));

//server routes - AJAX calls
app.get("/login", (req, res) => {
  processLogin(req, res);
});
app.get("/loginname", (req, res) => {
  processLoginName(req, res);
});
app.get("/death", (req, res) => {
  processDeath(req, res);
});
app.get("/chat", (req, res) => {
  processChat(req, res);
});
app.use((req, res) => {
  res.writeHead(404);
  res.end('Not found.');
  console.log('Error: Invalid Request: ' + req.url);
});

var server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

//initialize socket.io connection to send player list
var clientList = new Object();
io.on('connection',
  function (socket) {
      var clientIPAddress = socket.request.remoteAddress;
      console.log("New Connection from " + clientIPAddress);
      clientList[clientIPAddress] = 0;
  }
);

//start server
server.listen(PORT, HOST, () => { console.log(`Server running at http://${HOST}:${PORT}/`); });