// nodestat2 by Andreas Diehl @ IWR

// dependencies
var fs = require('fs');
var async = require('async');
var child_process = require('child_process');
var _ = require('lodash');

// variables
var ignoreUsers = ['root', 'syslog', 'mysql', 'apache', 'message+', 'daemon', 'statd', 'www-data', 'postfix', 'sshd', 'proftpd'];
var nodestat = {};

// functions
function decodePs(psString) {
  // separate into lines
  psLines = psString.toString().split("\n");
  // remove first line
  psLines.shift();
  // regex
  var regex = /([A-Za-z0-9._\+-]+)\s+(\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+)\s+(\d+)\s+([A-Za-z0-9?\/]+)\s+([A-Za-z+-<>]+)\s+([^\s\\]+)\s+(\d+:\d+)\s+(.+)/;
  var maxProcess = {
    cpu : -1
  };
  var processes = [];
  _.each(psLines, function(psLine) {
    var matches = psLine.match(regex);
    if (matches) {
      var processDetails = {
        user : matches[1],
        pid : parseInt(matches[2]),
        cpu : parseFloat(matches[3]),
        mem : parseFloat(matches[4]),
        vsz : parseInt(matches[5]),
        rss : parseInt(matches[6]),
        tty : matches[7],
        stat : matches[8],
        startTime : matches[9],
        cpuTime : matches[10],
        cmd : matches[11]
      };

      // skip root processes
      if (ignoreUsers.indexOf(processDetails.user.toString()) === -1) {
        if (processDetails.cpu > maxProcess.cpu) {
          maxProcess = processDetails;
        }
        processes.push(processDetails);
      }
    }
  });
  return {
    maxProcess : maxProcess,
    processes : processes
  };
}


// program code
fs.readFile(__dirname + '/nodes.txt', function(err, file) {
  if (err) {
    throw err;
  }
  var nodes = file.toString().split("\n");
  var stats = [];
  async.each(nodes, function(line, callback) {
    var node = line.trim();
    if (node !== '') {
      var cmd = '/usr/bin/ssh ' + node + ' /bin/ps auxx';
      child_process.exec(cmd, function(err, stdout, stderr) {
        var psList = decodePs(stdout);
        var currentNode = {
          'hostname' : node,
          'status' : 'free',
          'user' : '-',
          'process' : '-'
        };
        if (psList.processes.length !== 0) {
          // system is in use
          currentNode.user = psList.maxProcess.user;
          currentNode.process = psList.maxProcess.cmd;
          if (psList.maxProcess.cpu > 20) {
            currentNode.status = 'busy';
          } else {
            currentNode.status = 'in use';
          }
        }
        stats.push(currentNode);
        callback();
      })
    }
  }, function(err) {
    var sorted = _.sortBy(stats, [function(o) { return o.hostname; }]);
    fs.writeFile(__dirname + '/htdocs/nodestat.json', JSON.stringify(sorted));
  })
});