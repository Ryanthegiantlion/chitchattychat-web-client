var utilities = require('../utilities')

var SessionModel = require('./sessionModel')
var MessagesModel = require('./messagesModel')
var ChannelsModel = require('./channelsModel')

var MessagesView = require('./messagesView')
var ChannelsView = require('./channelsView')

var SocketEvents = require('../constants/SocketEvents')


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

  var query = {query: "userId=" + app.session.userId + "&userName=" + app.session.userName + "&lastMessageTimeStamp=" + app.session.lastMessageTimeStamp.toJSON()};
  window.socket = io(socketUrl, query);
  window.pingFuncId = undefined;

  //var socket = io('https://chatty-socket-chat-server.herokuapp.com/', query);
  
  window.socket.on(SocketEvents.Message, function(data){
    app.session.lastMessageTimeStamp = new Date(data.timestamp);
    if (!app.session.lastMessageTimeStamp.toJSON) {alert('no tojson method for date!!!')}
    localStorage.setItem('lastMessageTimeStamp', app.session.lastMessageTimeStamp.toJSON());
    //onReceivedMessage(data);
    app.messagesModel.addMessage(data);
    if (data.type == 'DirectMessage') {
      window.socket.emit(SocketEvents.MessageDeliveredConfirmation, data);
    }
    utilities.notifyMe(data.text)
  });
  window.socket.on(SocketEvents.MessageDeliveredConfirmation, function(data) {
    console.log('delivery confirmation 111')
    app.messagesModel.confirmDelivery(data);
  });
  window.socket.on(SocketEvents.MessageSentConfirmation, function(data){
    app.session.lastMessageTimeStamp = new Date(data.timestamp);
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