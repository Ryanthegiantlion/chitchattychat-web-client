var MessagesModel = function() {
	this.loadMessages();
}

var SocketEvents = {
	PingPong: 'pingPong',
	Message: 'message',
    MessageSentConfirmation: 'messageSentConfirmation',
    MessageDeliveredConfirmation: 'messageDeliveredConfirmation',
    OnlineStatus: 'onlineStatus',
    TypingStatus: 'typingStatus',
}

MessagesModel.prototype = {
	loadMessages: function() {
		this.chatMessages = JSON.parse(localStorage.getItem('messages:' + app.session.userId)) || { '0': {messages:[]}};
	},

	saveMessages: function() {
		localStorage.setItem('messages:' + app.session.userId, JSON.stringify(this.chatMessages));
	},

	getOfflineMessages: function() {
	  // query = app.session.lastMessageTimeStamp ? {lastMessageTimeStamp: app.session.lastMessageTimeStamp.toJSON()} : null;
	  // $.ajax({
	  //     url: apiUrl + '/messages/unread',
	  //     contentType: "application/json; charset=UTF-8",
	  //     headers: {'User-Id': app.session.userId},
	  //     data: query
	  //   })
	  //   .done(function(data, testStatus,jqXHR) {
	  //     if (data && data.length > 0) {
	  //       var lastMessage = data[0];
	  //       //TODO: eeeew!!!!
	  //       data.reverse();
	  //       data.forEach(function(messageItem)
	  //       {
	  //         if (messageItem.type == 'DirectMessage') {
	  //           window.socket.emit(SocketEvents.MessageDeliveredConfirmation, messageItem);
	  //         }
	  //         var userWithUnreadMessage = app.channelsModel.users.find(function(userItem) { return messageItem.senderId == userItem._id});
	  //         if (userWithUnreadMessage) {
	  //           userWithUnreadMessage.hasUnreadMessages = true;
	  //         }
	  //         app.messagesModel.addMessage(messageItem);
	  //       });
	  //       app.session.lastMessageTimeStamp = new Date(lastMessage.timestamp);
	  //       if (!app.session.lastMessageTimeStamp.toJSON) {alert('no tojson method for date!!!')}
	  //       localStorage.setItem('lastMessageTimeStamp', app.session.lastMessageTimeStamp.toJSON());
	  //       app.channelsView.renderChannels();
	  //     }
	  //   })
	  //   .fail(function() {
	  //     console.log( "failed to get offline messages" );
	  //   })
	  //   .always(function() {
	  //     console.log( "completed getting offline messages" );
	  // });
	},

	addMessage: function(data) {
		if (data.type == 'DirectMessage') {
	    if (!this.chatMessages[data.senderId]) {
	      this.chatMessages[data.senderId] = { messages: [] };
	    }
	    this.chatMessages[data.senderId].messages.push({
	      clientStartTime: data.clientStartTime,
	      clientEndTime: data.clientEndTime,
	      senderName: data.senderName,
	      text: data.text,
	      clientMessageIdentifier: data.clientMessageIdentifier,
	      timestamp: data.timestamp
	    });
	  }
	  else if (data.type == 'Group') {
	    this.chatMessages['0'].messages.push({
	      senderName: data.senderName,
	      text: data.text,
	      clientMessageIdentifier: data.clientMessageIdentifier,
	      timestamp: data.timestamp
	    });
	  }

  	this.saveMessages();

  	$(this).trigger('messageAdded', data);
	},

	confirmSend: function(data)
	{
	  if (data.type == 'Group') {
	    var message = this.chatMessages['0'].messages.find((item) => item.clientMessageIdentifier == data.clientMessageIdentifier);
	    message.timestamp = data.timestamp;
	    message.isSent = true;
	  } else {
	    var message = this.chatMessages[data.receiverId].messages.find((item) => item.clientMessageIdentifier == data.clientMessageIdentifier);
	    message.timestamp = data.timestamp;
	    message.isSent = true;
	  }

	  this.saveMessages();

	  $(this).trigger('messageSendConfirmed', data);
	},

	confirmDelivery: function(data)
	{
	  if (!data && !data.length) {
	    console.log('Why are we getting empty message receipt confirmatipons?');
	    return;
	  }

	  data.forEach(messageDeliveryConfirmation => {
	    if (messageDeliveryConfirmation.type == 'Channel') {
	      console.log('should not be getting message receipts for this type!')
	    } else {
	      // TODO: Can perhaps make this more effecient
	      var currentMessage = this.chatMessages[messageDeliveryConfirmation.receiverId].messages.find((message) => message.clientMessageIdentifier == messageDeliveryConfirmation.clientMessageIdentifier);
	      
	      var currentTime = new Date();

	      // TODO: why are we needing this check?
	      if (currentMessage) {
	        currentMessage.timestamp = messageDeliveryConfirmation.timestamp;
	        currentMessage.isDelivered = true;
	        currentMessage.clientEndTime = currentTime;
	        currentMessage.timeElapsed = currentTime - currentMessage.clientStartTime;
	      }
	    }

	    $(this).trigger('messageDeliveryConfirmed', data);
	    // add confirmation mark
	    //$('li[data-clientMessageIdentifier=' + messageReceivedConfirmation.clientMessageIdentifier + ']').addClass('received');
	  });

	  //localStorage.setItem('messages:' + app.session.userId, JSON.stringify(app.messagesModel.chatMessages));
		this.saveMessages();
	},

	log: function() {
		console.log(this.chatMessages)
	}
}

module.exports = MessagesModel