var moment = require('moment');
console.log(moment().format())

console.log('running chat module')

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function addMessageToStore(data)
{
  if (data.type == 'DirectMessage') {
    if (!chatMessages[data.senderId]) {
      chatMessages[data.senderId] = { messages: [] };
    }
    chatMessages[data.senderId].messages.push({
      clientStartTime: data.clientStartTime,
      clientEndTime: data.clientEndTime,
      senderName: data.senderName,
      text: data.text,
      clientMessageIdentifier: data.clientMessageIdentifier,
      timestamp: data.timestamp
    });
  }
  else if (data.type == 'Channel') {
    chatMessages['0'].messages.push({
      senderName: data.senderName,
      text: data.text,
      clientMessageIdentifier: data.clientMessageIdentifier,
      timestamp: data.timestamp
    });
  }

  localStorage.setItem('messages:' + window.userId, JSON.stringify(chatMessages));
}

function renderMessages($target, messages)
{
  $('#messages').html('');
  messages.forEach(function(item) {
    addMessageToDom(item);
  });
}

function changeSelectedTab()
{
  $('.selected').removeClass('selected');
  $('a[data-id="' + window.chatData.id + '"]').addClass('selected');
}

function registerClickHandlers(evt)
{
  // TODO: These two function are basically the same lets improve!
  $( ".channels-container" ).click(function(e) {
    window.chatData = {type: "Channel", id: 0, name: " General"};
    var tabMessages = chatMessages['0'].messages;
    console.log('switching channels: ' + JSON.stringify(chatData))
    renderMessages($(e.target), tabMessages);
    var messages  = $('#messages');
    messages.scrollTop($('#messages')[0].scrollHeight);
    changeSelectedTab();
  });
  $( ".users-container" ).click(function(e) {
    window.chatData = {type: "DirectMessage", id: $(e.target).attr('data-id'), name: $(e.target).html()};
    var tabMessages = chatMessages[window.chatData.id].messages;
    console.log('switching channels: ' + JSON.stringify(chatData));
    var selectedUserId = $(e.target).attr('data-id');
    var selectedUser = window.users.find(function(item) { return item._id == selectedUserId});
    if (selectedUser) {
      selectedUser.hasUnreadMessages = false;
    }
    localStorage.setItem('users:' + window.userId, JSON.stringify(window.users));
    renderMessages($(e.target), tabMessages);
    var messages  = $('#messages');
    messages.scrollTop($('#messages')[0].scrollHeight);
    renderUsers();
    changeSelectedTab();
    //changeSelectedTab($(e.target));
    // TODO: eeeeew. we are doing this because the tob get re rended so the target disappears
    // $('.selected').removeClass('selected');
    // $('a[data-id="' + selectedUserId + '"]').addClass('selected');
  });
  $('#messageContainer').click(function(e) {
    var $sourceElement = $(e.target);
    if ($sourceElement.hasClass('delivery-receipt-confirmation')) {
      var clientMessageIdentifier = $sourceElement.attr('data-client-message-indentifier');
      var receiverId = $sourceElement.attr('data-receiver-id');
      var message = window.chatMessages[receiverId].messages.find((message) => message.clientMessageIdentifier == clientMessageIdentifier);
      if (message) {
        console.log(message.timeElapsed);
      }
    }
    
  });
  $('.logout').click(function(e) {
    localStorage.clear();
    window.socket.disconnect();
    window.location.reload();
  }) 
}

function renderUsers()
{
  // TODO: Move out the bit that is not rendering!
  // store .addClass('received-messages')
  //var usersWithPendingMessages = $(".received-messages").map(function(){return $(this).attr("data-id");}).get();
  
  $('.users-container').html('');


  window.users.forEach(function(item){

    if (!chatMessages[item._id]) {
      chatMessages[item._id] = { messages: [] };
    }
    if (item._id != window.userId) {
      var userLinkText = $('<span>').attr('data-id', item._id).text(item.userName);

      var activityIcon = $('<span>').attr('data-id', item._id).addClass('fa').addClass('indicator-icon');

      var isCurrentlyTyping = $('<span>').attr('data-id', item._id).addClass('typing-indicator').html('...');

      if (!(item._id in window.onlineIndicators)) {
        activityIcon.addClass('fa-circle-o').addClass('offline');
      }
      else {
        activityIcon.addClass('fa-circle').addClass('online');
      }

      var userLink = $('<a>')
        .attr('href', 'javascript:;')
        .attr('data-id', item._id);

      if (window.chatData.id == item._id) {
        userLink.addClass('selected');
      }

      if (window.typingIndicators[item._id]) {
        userLink.addClass('is-typing');
      }

      if (item.hasUnreadMessages) {
        userLink.addClass('received-messages');
      }

      userLink.append([activityIcon, userLinkText, isCurrentlyTyping]);
    }

    $('.users-container').append(userLink);
  });

  // add the pending messages back
  // usersWithPendingMessages.forEach(function(senderId){
  //   $('a[data-id="' + senderId + '"]').addClass('received-messages');
  // });
}

function getUsers()
{
  $.ajax({
      url: apiUrl + '/users',
      contentType: "application/json; charset=UTF-8",
    })
    .done(function(data, testStatus,jqXHR) {
      console.log( "get users success" );
      console.log(data);
      data.forEach(function(user){
        if (!window.users.find(function(cachedUser){return cachedUser._id == user._id})) {
          window.users.push(user);
        }
        // if (!(user._id in window.userStatuses)) {
        //   window.onlineIndicators[user_.id] = false;
        // }
      });
      localStorage.setItem('users:' + window.userId, JSON.stringify(window.users));
      renderUsers();
    })
    .fail(function() {
      console.log( "failure to get users" );
    })
    .always(function() {
      console.log( "completed getting users" );
  });
}

// function loadUsersFromLocalStorage()
// {
//   var users = JSON.parse(localStorage.getItem('users:' + window.userId));
//   if (users)
//   {
//     renderUsers(users);
//   }
// }

function formatDate(date)
{
  //return date.getHours() + ':' + date.getMinutes();
  return moment(date).format('MMMM Do, h:mm');
}

function addMessageToDom(data)
{
  var li = $('<li>');
  li.attr('data-clientMessageIdentifier', data.clientMessageIdentifier)
  if (data.isDelivered) {
    li.addClass('delivered');
  }
  if (data.isReceived) {
    li.addClass('received');
  }
  //console.log(data)
  var name = $('<span>').addClass('sender').text(data.senderName);
  var clientTime = $('<span>').addClass('sentDate').text(formatDate(data.timestamp));
  var message = $('<span>').addClass('message').text(data.text);
  var deliveryConfirmation = $('<span>').addClass('fa').addClass('fa-check').addClass('delivery-confirmation');
  var deliveryReceiptConfirmation = $('<span>').addClass('fa')
    .addClass('fa-check')
    .addClass('delivery-receipt-confirmation')
    .attr('data-client-message-indentifier', data.clientMessageIdentifier)
    .attr('data-receiver-id', window.chatData.id);
  li.append([name, clientTime, deliveryConfirmation, deliveryReceiptConfirmation, message]);
  $('#messages').append(li);
  // on start we are calling this method one by one for all offline messages, this 
  // results in way to many scrolls :-(
  // var $messageContainer = $('#messages');
  // $messageContainer.animate({"scrollTop": $('#messages')[0].scrollHeight}, "slow");
}

function scrollToBottomOfMessages()
{
  var $messageContainer = $('#messages');
  $messageContainer.animate({"scrollTop": $('#messages')[0].scrollHeight}, "slow");
}

function onReceivedMessage(data)
{
  console.log('Received message: ' + JSON.stringify(data));

  addMessageToStore(data);
  var watchingDirectMessageWindow = (window.chatData.type == data.type && data.senderId == window.chatData.id)
  
  if (watchingDirectMessageWindow) {
    //$('#messages').append($('<li>').text(data.text));
    //data.time = new Date();
    addMessageToDom(data);
    scrollToBottomOfMessages();
  }
  else if (window.chatData.type == 'Channel' && data.type == 'Channel') {
    //$('#messages').append($('<li>').text(data.text));
    //data.time = new Date();
    addMessageToDom(data);
    scrollToBottomOfMessages();
  }
  else if (data.type == 'DirectMessage') {
    var existingUser = window.users.find(function(item){ return item._id == data.senderId});
    if (existingUser) {
      existingUser.hasUnreadMessages = true;
    }
    renderUsers();
    localStorage.setItem('users:' + window.userId, JSON.stringify(window.users));
    //$('a[data-id="' + data.senderId + '"]').addClass('received-messages');
  }
  else if (data.type == 'Channel') {
    $('a[data-id="' + 0 + '"]').addClass('received-messages');
  }
}

function onMessageConfirmed(data)
{
  console.log('confirmed message: ' + JSON.stringify(data));

  if (data.type == 'Channel') {
    var message = window.chatMessages['0'].messages.find((item) => item.clientMessageIdentifier == data.clientMessageIdentifier);
    message.timestamp = data.timestamp;
    message.isDelivered = true;
  } else {
    var message = window.chatMessages[data.receiverId].messages.find((item) => item.clientMessageIdentifier == data.clientMessageIdentifier);
    message.timestamp = data.timestamp;
    message.isDelivered = true;
  }

  // add confirmation mark
  $('li[data-clientMessageIdentifier=' + data.clientMessageIdentifier + ']').addClass('delivered');
  
  localStorage.setItem('messages:' + window.userId, JSON.stringify(chatMessages));
  // TODO
  // addMessageToStore({
  //   type: data.type,
  //   senderId: data.receiverId, 
  //   senderName: data.senderName, 
  //   clientMessageIdentifier: data.clientMessageIdentifier,
  //   text: data.text
  // });
}

function onMessageReceiptConfirmed(data)
{
  console.log('confirmed receipt message: ' + JSON.stringify(data));

  if (!data && !data.length) {
    console.log('Why are we getting empty message receipt confirmatipons?');
    return;
  }

  data.forEach(messageReceivedConfirmation => {
    if (messageReceivedConfirmation.type == 'Channel') {
      console.log('should not be getting message receipts for this type!')
    } else {
      // TODO: Can perhaps make this more effecient
      var currentMessage = window.chatMessages[messageReceivedConfirmation.receiverId].messages.find((message) => message.clientMessageIdentifier == messageReceivedConfirmation.clientMessageIdentifier);
      
      var currentTime = new Date();

      // TODO: why are we needing this check?
      if (currentMessage) {
        currentMessage.timestamp = messageReceivedConfirmation.timestamp;
        currentMessage.isReceived = true;
        currentMessage.clientEndTime = currentTime;
        currentMessage.timeElapsed = currentTime - currentMessage.clientStartTime;
      }
    }

    // add confirmation mark
    $('li[data-clientMessageIdentifier=' + messageReceivedConfirmation.clientMessageIdentifier + ']').addClass('received');
  });

  localStorage.setItem('messages:' + window.userId, JSON.stringify(chatMessages));
  // TODO
  // addMessageToStore({
  //   type: data.type,
  //   senderId: data.receiverId, 
  //   senderName: data.senderName, 
  //   clientMessageIdentifier: data.clientMessageIdentifier,
  //   text: data.text
  // });
}

function getOfflineMessages()
{
  console.log('attempting to get offline messages');
  query = window.lastMessageTimeStamp ? {lastMessageTimeStamp: window.lastMessageTimeStamp.toJSON()} : null;
  console.log(query);
  $.ajax({
      url: apiUrl + '/messages/unread',
      contentType: "application/json; charset=UTF-8",
      headers: {'User-Id': window.userId},
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
          var userWithUnreadMessage = window.users.find(function(userItem) { return messageItem.senderId == userItem._id});
          if (userWithUnreadMessage) {
            userWithUnreadMessage.hasUnreadMessages = true;
          }
          addMessageToStore(messageItem);
        });
        window.lastMessageTimeStamp = new Date(lastMessage.timestamp);
        if (!window.lastMessageTimeStamp.toJSON) {alert('no tojson method for date!!!')}
        localStorage.setItem('lastMessageTimeStamp', window.lastMessageTimeStamp.toJSON());
        console.log('done syncing messages');
        renderUsers();

      }
    })
    .fail(function() {
      console.log( "failed to get offline messages" );
    })
    .always(function() {
      console.log( "completed getting offline messages" );
  });
}

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

    setTimeout(notification.close.bind(notification), 1000)
  }
}

function clearTimeoutIndicator() {
  window.isTyping = false;
  window.socket.emit('typingIndicator', { isTyping: false, receiverId: window.chatData.id });
}

function onNewMessageTextChange()
{
  if (window.chatData.type == 'DirectMessage') {
    if (!window.isTyping) {
      window.socket.emit('typingIndicator', { isTyping: true, receiverId: window.chatData.id })
      window.isTyping = true;
      window.typingTimeoutFunc = setTimeout(() => clearTimeoutIndicator(), 4000);
    }
    else {
      clearTimeout(window.typingTimeoutFunc);
      window.typingTimeoutFunc = setTimeout(() => clearTimeoutIndicator(), 4000);
    }
  }
}

function initChat()
{
  window.userName = localStorage.getItem('userName');
  window.userId = localStorage.getItem('_id');
  window.lastMessageTimeStamp = new Date(localStorage.getItem('lastMessageTimeStamp'));
  window.users = JSON.parse(localStorage.getItem('users:' + window.userId)) || [];
  window.chatMessages = JSON.parse(localStorage.getItem('messages:' + window.userId)) || { '0': {messages:[]}}
  window.chatData =  {type: "Channel", id: 0, name: " General"};
  window.onlineIndicators = {}
  window.typingIndicators = {}
  window.isCurrentlyTyping = false;
  window.typingTimoutFunc = undefined;
  // windows.user.forEach(function(item){
  //   onlineIndicators[item] == false;
  // });

  renderUsers();

  var tabMessages = chatMessages['0'].messages;
  var currentTab = $('.channels-container a');
  renderMessages(currentTab, tabMessages);
  var messages  = $('#messages');
  messages.scrollTop($('#messages')[0].scrollHeight);
  $('#UserInfo').html('logged in as: ' + userName);

  

  console.log('signed in for user ' + userId + ' ' + userName);
  var query = {query: "userId=" + userId + "&userName=" + userName };
  window.socket = io(socketUrl, query);
  //var socket = io('https://chatty-socket-chat-server.herokuapp.com/', query);
  $('#messageForm').submit(function() {
    clearTimeout(window.typingTimeoutFunc);
    clearTimeoutIndicator();
    newMessage = $('#m').val();
    messageData = {
      type: window.chatData.type, 
      text: newMessage, 
      receiverId: window.chatData.id, 
      clientMessageIdentifier: guid(),
      clientStartTime: new Date()
    };
    //if (window.chatData.type != 'Channel') {
    addMessageToStore({
      clientStartTime: messageData.clientStartTime,
      type: messageData.type,
      senderId: messageData.receiverId, 
      senderName: window.userName, 
      clientMessageIdentifier: messageData.clientMessageIdentifier,
      text: messageData.text
    });

    addMessageToDom({senderName: window.userName, text: newMessage, isSending: true, clientMessageIdentifier: messageData.clientMessageIdentifier});
    scrollToBottomOfMessages();
    //}
    
    console.log('attempting to send message: ' + JSON.stringify(messageData));
    window.socket.emit('message', messageData);
    $('#m').val('');
    return false;
  });
  $('#m').on('input', function() {
    onNewMessageTextChange();
  });
  window.socket.on('message', function(data){
    window.lastMessageTimeStamp = new Date(data.timestamp);
    if (!window.lastMessageTimeStamp.toJSON) {alert('no tojson method for date!!!')}
    localStorage.setItem('lastMessageTimeStamp', window.lastMessageTimeStamp.toJSON());
    onReceivedMessage(data);
    if (data.type == 'DirectMessage') {
      window.socket.emit('messageReceived', data);
    }
    notifyMe(data.text)
  });
  window.socket.on('messageReceived', function(data) {
    onMessageReceiptConfirmed(data);
  });
  window.socket.on('messageConfirmation', function(data){
    window.lastMessageTimeStamp = new Date(data.timestamp);
    localStorage.setItem('lastMessageTimeStamp', window.lastMessageTimeStamp.toJSON());
    onMessageConfirmed(data);
  });
  window.socket.on('onlineIndicators', function(data){
    window.onlineIndicators = {}
    data.onlineUsers.forEach(function(userId){
      window.onlineIndicators[userId] = true;
    });
    renderUsers();
  });
  window.socket.on('typingIndicator', function(data) {
    window.typingIndicators[data.senderId] = data.isTyping;
    renderUsers()
  });
  window.socket.on('connect', function() {
    console.log('connected socket. transport: ' + window.socket.io.engine.transport.name);
  });


  //loadUsersFromLocalStorage();
  getUsers();
  getOfflineMessages();
  registerClickHandlers();
}

module.exports = { initChat }