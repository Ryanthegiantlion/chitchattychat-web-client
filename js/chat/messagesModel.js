var MessagesModel = function() {
	this.loadMessages();
}

MessagesModel.prototype = {
	loadMessages: function() {
		this.chatMessages = JSON.parse(localStorage.getItem('messages:' + app.session.userId)) || { '0': {messages:[]}};
	},

	saveMessages: function() {
		localStorage.setItem('messages:' + app.session.userId, JSON.stringify(this.chatMessages));
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
	  else if (data.type == 'Channel') {
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

	confirmMessage: function(data)
	{
	  if (data.type == 'Channel') {
	    var message = this.chatMessages['0'].messages.find((item) => item.clientMessageIdentifier == data.clientMessageIdentifier);
	    message.timestamp = data.timestamp;
	    message.isDelivered = true;
	  } else {
	    var message = this.chatMessages[data.receiverId].messages.find((item) => item.clientMessageIdentifier == data.clientMessageIdentifier);
	    message.timestamp = data.timestamp;
	    message.isDelivered = true;
	  }

	  this.saveMessages();

	  $(this).trigger('messageConfirmed', data);
	},

	confirmMessageReceipts: function(data)
	{
	  if (!data && !data.length) {
	    console.log('Why are we getting empty message receipt confirmatipons?');
	    return;
	  }

	  data.forEach(messageReceivedConfirmation => {
	    if (messageReceivedConfirmation.type == 'Channel') {
	      console.log('should not be getting message receipts for this type!')
	    } else {
	      // TODO: Can perhaps make this more effecient
	      var currentMessage = this.chatMessages[messageReceivedConfirmation.receiverId].messages.find((message) => message.clientMessageIdentifier == messageReceivedConfirmation.clientMessageIdentifier);
	      
	      var currentTime = new Date();

	      // TODO: why are we needing this check?
	      if (currentMessage) {
	        currentMessage.timestamp = messageReceivedConfirmation.timestamp;
	        currentMessage.isReceived = true;
	        currentMessage.clientEndTime = currentTime;
	        currentMessage.timeElapsed = currentTime - currentMessage.clientStartTime;
	      }
	    }

	    $(this).trigger('messageReceiptConfirmed', data);
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