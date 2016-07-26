var utilities = require('../utilities')
var SocketEvents = require('../constants/socketEvents')

var MessagesView = function(messagesModel, channelsModel) {
	this.messagesModel = messagesModel;
	this.channelsModel = channelsModel;
	this.isCurrentlyTyping = false;
  this.typingTimoutFunc = undefined;

	this.bindModelEvents();
	this.bindDomEvents();
}

MessagesView.prototype = {
	clearTimeoutIndicator: function() {
	  window.isTyping = false;
	  window.socket.emit(SocketEvents.TypingStatus, { isTyping: false, receiverId: app.channelsModel.currentChannel.userId });
	},

	bindModelEvents: function() {
	  $(this.messagesModel).on('messageSendConfirmed', (e, data) => {
	  	$('li[data-clientMessageIdentifier=' + data.clientMessageIdentifier + ']').addClass('sent');
	  });

	  // $('li[data-clientMessageIdentifier=' + messageReceivedConfirmation.clientMessageIdentifier + ']').addClass('received');
	  $(this.messagesModel).on('messageDeliveryConfirmed', (e, data) => {
	  	$('li[data-clientMessageIdentifier=' + data.clientMessageIdentifier + ']').addClass('delivered');	  
	  });

	  $(this.messagesModel).on('messageAdded', (e, data) => {
	  	if (data.chatId == app.channelsModel.currentChannel.chatId) {
	  		this.renderMessage(data);	 

	  		utilities.scrollToBottom('#messages'); 
	  	}
	  });

	  $(this.channelsModel).on('change:selected', (e, data) => {
	  	console.log(this.channelsModel.currentChannel)
	  	var newChannelChatId = this.channelsModel.currentChannel.chatId;
	  	var tabMessages = this.messagesModel.chatMessages[newChannelChatId].messages;
		  this.renderMessages($(e.target), tabMessages);
		  // unlike the utility method we want this scroll to be immediate
		  $('#messages').scrollTop($('#messages')[0].scrollHeight);
	  });
	},

	imageUrlRegex: /^https?:\/\/.*(jpg|png|gif|bmp)/,

	getMessageBody: function(text) {
		if (this.imageUrlRegex.test(text)) {
			return {
				type: 'Image',
				url: text
			}
		} else {
			return {
				type: 'TextMessage',
				text: text
			}
		}
	},

	bindDomEvents: function() {
		$('#messageContainer').click(function(e) {
	    var $sourceElement = $(e.target);
	    if ($sourceElement.hasClass('delivery-confirmation')) {
	      var clientMessageIdentifier = $sourceElement.attr('data-client-message-indentifier');
	      var receiverId = $sourceElement.attr('data-receiver-id');
	      var message = app.messagesModel.chatMessages[chatId].messages.find((message) => message.clientMessageIdentifier == clientMessageIdentifier);
	      if (message) {
	        console.log(message.timeElapsed);
	      }
	    }
	  });

	  $('#messageForm').submit(() => {
	    clearTimeout(window.typingTimeoutFunc);
	    this.clearTimeoutIndicator();
	    newMessage = $('#m').val();
	    messageData = {
	    	chatId: app.channelsModel.currentChannel.chatId,
	      type: app.channelsModel.currentChannel.type,
	      body: this.getMessageBody(newMessage),
	      receiverId: app.channelsModel.currentChannel.userId,
	      senderId: app.session.userId,
	      senderName: app.session.userName, 
	      clientMessageIdentifier: utilities.guid(),
	      clientStartTime: new Date()
	    };
	    
	    this.messagesModel.addMessage(messageData);

	    //this.renderMessage({senderName: app.session.userName, text: newMessage, isSending: true, clientMessageIdentifier: messageData.clientMessageIdentifier});
	    //scrollToBottomOfMessages();
	    //utilities.scrollToBottom('#messages');
	    
	    window.socket.emit('message', messageData);
	    $('#m').val('');
	    return false;
	  });
	  
	  $('#m').on('input', () => {
	    if (app.channelsModel.currentChannel.type == 'DirectMessage') {
		    if (!window.isTyping) {
		      window.socket.emit(SocketEvents.TypingStatus, { isTyping: true, receiverId: app.channelsModel.currentChannel.userId })
		      window.isTyping = true;
		      window.typingTimeoutFunc = setTimeout(() => this.clearTimeoutIndicator(), 4000);
		    }
		    else {
		      clearTimeout(window.typingTimeoutFunc);
		      window.typingTimeoutFunc = setTimeout(() => this.clearTimeoutIndicator(), 4000);
		    }
		  }
	  });
	},

	messageBodyHtml: function(body) {
		if (body.type == 'TextMessage') {
			var html = $('<span>').addClass('textMessage').text(body.text);
		} else if (body.type == 'Image'){
			var html = $('<img>').addClass('imageMessage').attr('src', body.url);
		} else {
			throw 'Unknown Message Type'
		}

		return html;
	},

	renderMessage: function(data) {
		var li = $('<li>');
		  li.attr('data-clientMessageIdentifier', data.clientMessageIdentifier)
		  if (data.isDelivered) {
		    li.addClass('delivered');
		  }
		  if (data.isSent) {
		    li.addClass('sent');
		  }
		  var name = $('<span>').addClass('sender').text(data.senderName);
		  var clientTime = $('<span>').addClass('sentDate').text(utilities.formatDate(data.timestamp));
		  var sentConfirmation = $('<span>')
		  	.addClass('fa')
		  	.addClass('fa-check')
		  	.addClass('sent-confirmation');
		  var deliveryConfirmation = $('<span>').addClass('fa')
		    .addClass('fa-check')
		    .addClass('delivery-confirmation')
		    .attr('data-client-message-indentifier', data.clientMessageIdentifier)
		    .attr('data-receiver-id', app.channelsModel.currentChannel.id);
		  var messageBody = this.messageBodyHtml(data.body);
		  li.append([name, clientTime, sentConfirmation, deliveryConfirmation, messageBody]);
		  $('#messages').append(li); 
	},

	renderMessages: function($target, messages)
	{
	  $('#messages').html('');
	  messages.forEach(function(item) {
	    app.messagesView.renderMessage(item);
	  });
	}
}

module.exports = MessagesView