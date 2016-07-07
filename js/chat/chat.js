var utilities = require('../utilities')

var SessionModel = require('./sessionModel')
var MessagesModel = require('./messagesModel')
var ChannelsModel = require('./channelsModel')

var MessagesView = require('./messagesView')
var ChannelsView = require('./channelsView')

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

  var query = {query: "userId=" + app.session.userId + "&userName=" + app.session.userName };
  window.socket = io(socketUrl, query);
  //var socket = io('https://chatty-socket-chat-server.herokuapp.com/', query);
  
  window.socket.on('message', function(data){
    app.session.lastMessageTimeStamp = new Date(data.timestamp);
    if (!app.session.lastMessageTimeStamp.toJSON) {alert('no tojson method for date!!!')}
    localStorage.setItem('lastMessageTimeStamp', app.session.lastMessageTimeStamp.toJSON());
    //onReceivedMessage(data);
    app.messagesModel.addMessage(data);
    if (data.type == 'DirectMessage') {
      window.socket.emit('messageReceived', data);
    }
    utilities.notifyMe(data.text)
  });
  window.socket.on('messageReceived', function(data) {
    app.messagesModel.confirmMessageReceipts(data);
  });
  window.socket.on('messageConfirmation', function(data){
    app.session.lastMessageTimeStamp = new Date(data.timestamp);
    localStorage.setItem('lastMessageTimeStamp', app.session.lastMessageTimeStamp.toJSON());
    app.messagesModel.confirmMessage(data);
  });
  window.socket.on('onlineIndicators', function(data){
    app.channelsModel.onlineIndicators = {}
    data.onlineUsers.forEach(function(userId){
      app.channelsModel.onlineIndicators[userId] = true;
    });
    app.channelsView.renderChannels();
  });
  window.socket.on('typingIndicator', function(data) {
    app.channelsModel.typingIndicators[data.senderId] = data.isTyping;
    app.channelsView.renderChannels();
  });
  window.socket.on('connect', function() {
    console.log('connected socket. transport: ' + window.socket.io.engine.transport.name);
  });


  app.channelsModel.sync();
  app.messagesModel.getOfflineMessages();
}

module.exports = { initChat }