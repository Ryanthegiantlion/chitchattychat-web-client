var utilities = require('../utilities')

var SessionModel = require('./sessionModel')
var MessagesModel = require('./messagesModel')
var ChannelsModel = require('./channelsModel')

var MessagesView = require('./messagesView')
var ChannelsView = require('./channelsView')

var SocketEvents = require('../constants/socketEvents')


function initChat()
{
  
  window.app = {}

  app.session = new SessionModel();
  app.messagesModel = new MessagesModel();
  app.channelsModel = new ChannelsModel();

  app.messagesView = new MessagesView(app.messagesModel, app.channelsModel);
  app.channelsView = new ChannelsView(app.channelsModel, app.messagesModel);

  app.channelsView.renderChannels();

  var tabMessages = app.messagesModel.chatMessages['0'].messages;
  var currentTab = $('.channels-container a');
  app.messagesView.renderMessages(currentTab, tabMessages);
  var messages  = $('#messages');
  messages.scrollTop($('#messages')[0].scrollHeight);
  $('#UserInfo').html('logged in as: ' + app.session.userName);

  var options = {query: app.session.getSocketQueryParameters()};
  console.log('#############creating socket connection###########');
  window.socket = io(socketUrl, options);
  window.pingFuncId = undefined;

  //var socket = io('https://chatty-socket-chat-server.herokuapp.com/', query);
  
  window.socket.on(SocketEvents.Message, function(data){
    console.log('updating timestamp')
    app.session.updateTimeStamp(new Date(data.timestamp));
    console.log(app.session.lastMessageTimeStamp);
    if (!app.session.lastMessageTimeStamp.toJSON) {alert('no tojson method for date!!!')}
    localStorage.setItem('lastMessageTimeStamp', app.session.lastMessageTimeStamp.toJSON());
    //onReceivedMessage(data);
    app.messagesModel.addMessage(data);
    if (data.type == 'DirectMessage') {
      window.socket.emit(SocketEvents.MessageDeliveredConfirmation, data);
    }
    utilities.notifyMe(data.body.text)
  });
  window.socket.on(SocketEvents.OfflineMessages, function(data){
    data.forEach((item) => { 
        if (item.type == 'DirectMessage') {
          app.messagesModel.addMessage(item);
          window.socket.emit(SocketEvents.MessageDeliveredConfirmation, item);
          app.messagesModel.addMessage(item);
        }
      }
    )
    console.log('updating timestamp')
    app.session.updateTimeStamp(new Date(data[data.length-1].timestamp));
    console.log(app.session.lastMessageTimeStamp);
    if (!app.session.lastMessageTimeStamp.toJSON) {alert('no tojson method for date!!!')}
    localStorage.setItem('lastMessageTimeStamp', app.session.lastMessageTimeStamp.toJSON());
    //onReceivedMessage(data);
    utilities.notifyMe(data[data.length-1].body.text)
  });
  window.socket.on(SocketEvents.MessageDeliveredConfirmation, function(data) {
    console.log('delivery confirmation 111')
    app.messagesModel.confirmDelivery(data);
  });
  window.socket.on(SocketEvents.MessageSentConfirmation, function(data){
    app.session.updateTimeStamp(new Date(data.timestamp));
    localStorage.setItem('lastMessageTimeStamp', app.session.lastMessageTimeStamp.toJSON());
    app.messagesModel.confirmSend(data);
  });
  window.socket.on(SocketEvents.OnlineStatus, function(data){
    app.channelsModel.onlineStatuses = {}
    data.onlineUsers.forEach(function(userId){
      app.channelsModel.onlineStatuses[userId] = true;
    });
    app.channelsView.renderChannels();
  });
  window.socket.on(SocketEvents.TypingStatus, function(data) {
    app.channelsModel.typingStatuses[data.senderId] = data.isTyping;
    app.channelsView.renderChannels();
  });
  window.socket.on(SocketEvents.Hello, function(data) {
    //console.log('got messages from server')
  });
  window.socket.on('connect', function() {
    console.log('connected socket. transport: ' + window.socket.io.engine.transport.name);
    window.pingFuncId = setInterval(function() {
      //console.log('pinging server');
      socket.emit(SocketEvents.Hello, {message: 'hello server'});
    }, 30000)
  });
  window.socket.on('disconnect', function() {
    clearInterval(window.pingFuncId);
  });


  app.channelsModel.sync();
  //app.messagesModel.getOfflineMessages();
}

module.exports = { initChat }