var SocketEvents = require('../constants/socketEvents')

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
    if (!this.chatMessages[data.chatId]) {
	      this.chatMessages[data.chatId] = { messages: [] };
	  }

	  this.chatMessages[data.chatId].messages.push(data);

  	this.saveMessages();

  	$(this).trigger('messageAdded', data);
	},

	addChat:function(chatId) {
		if (!this.chatMessages[chatId]) {
	      this.chatMessages[chatId] = { messages: [] };
	    }
	},

	confirmSend: function(data)
	{
    	var message = this.chatMessages[data.chatId].messages.find((item) => item.clientMessageIdentifier == data.clientMessageIdentifier);
    	message.timestamp = data.timestamp;
    	message.isSent = true;

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
	    if (messageDeliveryConfirmation.type == 'Group') {
	      console.log('should not be getting message receipts for this type!')
	    } else {
	      // TODO: Can perhaps make this more effecient
	      var currentMessage = this.chatMessages[messageDeliveryConfirmation.chatId].messages.find((message) => message.clientMessageIdentifier == messageDeliveryConfirmation.clientMessageIdentifier);
	      
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