var moment = require('moment');

// from: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
// We use the guid to tie together messsage confirmations etc.
// Slack uses an auto incrementing id that start from zero for each session. It 
// could be a better approach.

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}


function formatDate(date)
{
  return moment(date).format('MMMM Do, h:mm');
}

// shows a notification pop
// source: http://stackoverflow.com/questions/2271156/chrome-desktop-notification-example
function notifyMe(message) {
  if (!Notification) {
    alert('Desktop notifications not available in your browser. Try Chromium.'); 
    return;
  }

  var icons = [
    'https://avatars2.githubusercontent.com/u/1843898?v=3&s=400',
    'https://media.licdn.com/mpr/mpr/shrink_100_100/p/6/000/1e7/35f/2c28dff.jpg',
    'https://media.licdn.com/mpr/mpr/shrinknp_200_200/p/7/000/28c/14b/2c4f3c2.jpg',
    'https://pbs.twimg.com/profile_images/608693207933853696/211XBm42.jpg',
    'https://media.licdn.com/mpr/mpr/shrink_100_100/p/3/000/1af/001/136a9b0.jpg',
    'https://scontent-hkg3-1.xx.fbcdn.net/t31.0-8/12983376_10156774786815652_6903396637362173861_o.jpg'
  ]

  var icon = icons[Math.floor(Math.random()*icons.length)];

  if (Notification.permission !== "granted")
    Notification.requestPermission();
  else {
    var notification = new Notification('ChitChattyChat Message YO!', {
      icon: icon,
      body: message,
    });

    notification.onclick = function () {
      window.focus();     
    };

    setTimeout(notification.close.bind(notification), 4000)
  }
}

function scrollToBottom(selector)
{
  var $container = $(selector);
  $container.animate({"scrollTop": $(selector)[0].scrollHeight}, "slow");
}

function getTimestampFromId(_id)
{
  var timestamp = _id.toString().substring(0,8)
  var date = new Date( parseInt( timestamp, 16 ) * 1000 )

  return date;
}

module.exports = { guid, formatDate, notifyMe, scrollToBottom }