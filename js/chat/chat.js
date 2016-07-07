var utilities = require('../utilities')

var SessionModel = require('./sessionModel')
var MessagesModel = require('./messagesModel')
var ChannelsModel = require('./channelsModel')

var MessagesView = require('./messagesView')
var ChannelsView = require('./channelsView')

// Users

function changeSelectedTab()
{
  $('.selected').removeClass('selected');
  $('a[data-id="' + window.chatData.id + '"]').addClass('selected');
}

function registerChannelClickHandlers(evt)
{
  // TODO: These two function are basically the same lets improve!
  $( ".channels-container" ).click(function(e) {
    window.chatData = {type: "Channel", id: 0, name: " General"};
    var tabMessages = app.messagesModel.chatMessages['0'].messages;
    console.log('switching channels: ' + JSON.stringify(chatData))
    app.messagesView.renderMessages($(e.target), tabMessages);
    var messages  = $('#messages');
    messages.scrollTop($('#messages')[0].scrollHeight);
    changeSelectedTab();
  });
  $( ".users-container" ).click(function(e) {
    window.chatData = {type: "DirectMessage", id: $(e.target).attr('data-id'), name: $(e.target).html()};
    var tabMessages = app.messagesModel.chatMessages[window.chatData.id].messages;
    console.log('switching channels: ' + JSON.stringify(chatData));
    var selectedUserId = $(e.target).attr('data-id');
    var selectedUser = app.channelsModel.users.find(function(item) { return item._id == selectedUserId});
    if (selectedUser) {
      selectedUser.hasUnreadMessages = false;
    }
    localStorage.setItem('users:' + app.session.userId, JSON.stringify(app.channelsModel.users));
    app.messagesView.renderMessages($(e.target), tabMessages);
    var messages  = $('#messages');
    messages.scrollTop($('#messages')[0].scrollHeight);
    app.channelsView.renderChannels();
    changeSelectedTab();
    //changeSelectedTab($(e.target));
    // TODO: eeeeew. we are doing this because the tob get re rended so the target disappears
    // $('.selected').removeClass('selected');
    // $('a[data-id="' + selectedUserId + '"]').addClass('selected');
  });
  $('.logout').click(function(e) {
    localStorage.clear();
    window.socket.disconnect();
    window.location.reload();
  }) 
}

// Messages

function getOfflineMessages()
{
  console.log('attempting to get offline messages');
  query = app.session.lastMessageTimeStamp ? {lastMessageTimeStamp: app.session.lastMessageTimeStamp.toJSON()} : null;
  console.log(query);
  $.ajax({
      url: apiUrl + '/messages/unread',
      contentType: "application/json; charset=UTF-8",
      headers: {'User-Id': app.session.userId},
      data: query
    })
    .done(function(data, testStatus,jqXHR) {
      console.log( "offline message sync callback!!!" );
      if (data && data.length > 0) {
        console.log( "got offline messages !!!" );
        var lastMessage = data[0];
        //TODO: eeeew!!!!
        data.reverse();
        console.log(data);
        // TODO: very innefecient! so more localstorage adds!
        // TODO: these don't cause a rerender yet!
        // this only works for now because we have no sync for general channel
        data.forEach(function(messageItem)
        {
          if (messageItem.type == 'DirectMessage') {
            window.socket.emit('messageReceived', messageItem);
          }
          // TODO: eeeeew! lots of unnneeded dom changes here
          //$('a[data-id="' + item.senderId + '"]').addClass('received-messages');
          var userWithUnreadMessage = app.channelsModel.users.find(function(userItem) { return messageItem.senderId == userItem._id});
          if (userWithUnreadMessage) {
            userWithUnreadMessage.hasUnreadMessages = true;
          }
          app.messagesModel.addMessage(messageItem);
        });
        app.session.lastMessageTimeStamp = new Date(lastMessage.timestamp);
        if (!app.session.lastMessageTimeStamp.toJSON) {alert('no tojson method for date!!!')}
        localStorage.setItem('lastMessageTimeStamp', app.session.lastMessageTimeStamp.toJSON());
        console.log('done syncing messages');
        app.channelsView.renderChannels();

      }
    })
    .fail(function() {
      console.log( "failed to get offline messages" );
    })
    .always(function() {
      console.log( "completed getting offline messages" );
  });
}

// Unsorted


function initChat()
{
  
  window.app = {}

  app.session = new SessionModel();
  app.messagesModel = new MessagesModel();
  app.channelsModel = new ChannelsModel();

  app.messagesView = new MessagesView(app.messagesModel);
  app.channelsView = new ChannelsView(app.channelsModel, app.messagesModel);

  //app.channelsModel.users = JSON.parse(localStorage.getItem('users:' + app.session.userId)) || [];
  //app.messagesModel.chatMessages = JSON.parse(localStorage.getItem('messages:' + app.session.userId)) || { '0': {messages:[]}}

  window.chatData =  {type: "Channel", id: 0, name: " General"};
  window.onlineIndicators = {}
  window.typingIndicators = {}
  window.isCurrentlyTyping = false;
  window.typingTimoutFunc = undefined;

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
    window.onlineIndicators = {}
    data.onlineUsers.forEach(function(userId){
      window.onlineIndicators[userId] = true;
    });
    app.channelsView.renderChannels();
  });
  window.socket.on('typingIndicator', function(data) {
    window.typingIndicators[data.senderId] = data.isTyping;
    app.channelsView.renderChannels();
  });
  window.socket.on('connect', function() {
    console.log('connected socket. transport: ' + window.socket.io.engine.transport.name);
  });


  //loadUsersFromLocalStorage();
  app.channelsModel.sync();
  getOfflineMessages();
  registerChannelClickHandlers();
  //registerMessageClickHandlers();
}

module.exports = { initChat }