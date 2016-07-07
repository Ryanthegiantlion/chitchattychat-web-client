var utilities = require('../utilities')

var MessagesView = function(messagesModel) {
	this.messagesModel = messagesModel;

	this.bindModelEvents();
	this.bindDomEvents();
}

MessagesView.prototype = {
	clearTimeoutIndicator: function() {
	  window.isTyping = false;
	  window.socket.emit('typingIndicator', { isTyping: false, receiverId: window.chatData.id });
	},

	bindModelEvents: function() {
	  $(this.messagesModel).on('messageConfirmed', (e, data) => {
	  	$('li[data-clientMessageIdentifier=' + data.clientMessageIdentifier + ']').addClass('delivered');
	  });

	  // $('li[data-clientMessageIdentifier=' + messageReceivedConfirmation.clientMessageIdentifier + ']').addClass('received');
	  $(this.messagesModel).on('messageReceiptConfirmed', (e, data) => {
	  	$('li[data-clientMessageIdentifier=' + data.clientMessageIdentifier + ']').addClass('received');	  
	  });

	  $(this.messagesModel).on('messageAdded', (e, data) => {
	  	if (data.chatId == window.chatData.id) {
	  		this.renderMessage(data);	 

	  		utilities.scrollToBottom('#messages'); 
	  	}
	  });
	},

	bindDomEvents: function() {
		$('#messageContainer').click(function(e) {
	    var $sourceElement = $(e.target);
	    if ($sourceElement.hasClass('delivery-receipt-confirmation')) {
	      var clientMessageIdentifier = $sourceElement.attr('data-client-message-indentifier');
	      var receiverId = $sourceElement.attr('data-receiver-id');
	      var message = app.messagesModel.chatMessages[receiverId].messages.find((message) => message.clientMessageIdentifier == clientMessageIdentifier);
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
	    	chatId: window.chatData.id,
	      type: window.chatData.type,
	      text: newMessage, 
	      receiverId: window.chatData.id, 
	      clientMessageIdentifier: utilities.guid(),
	      clientStartTime: new Date()
	    };
	    
	    this.messagesModel.addMessage({
	    	chatId: window.chatData.id,
	      clientStartTime: messageData.clientStartTime,
	      type: messageData.type,
	      senderId: messageData.receiverId, 
	      senderName: app.session.userName, 
	      clientMessageIdentifier: messageData.clientMessageIdentifier,
	      text: messageData.text
	    });

	    //this.renderMessage({senderName: app.session.userName, text: newMessage, isSending: true, clientMessageIdentifier: messageData.clientMessageIdentifier});
	    //scrollToBottomOfMessages();
	    //utilities.scrollToBottom('#messages');
	    
	    window.socket.emit('message', messageData);
	    $('#m').val('');
	    return false;
	  });
	  
	  $('#m').on('input', () => {
	    if (window.chatData.type == 'DirectMessage') {
		    if (!window.isTyping) {
		      window.socket.emit('typingIndicator', { isTyping: true, receiverId: window.chatData.id })
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

	renderMessage: function(data) {
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
		  var clientTime = $('<span>').addClass('sentDate').text(utilities.formatDate(data.timestamp));
		  var message = $('<span>').addClass('message').text(data.text);
		  var deliveryConfirmation = $('<span>').addClass('fa').addClass('fa-check').addClass('delivery-confirmation');
		  var deliveryReceiptConfirmation = $('<span>').addClass('fa')
		    .addClass('fa-check')
		    .addClass('delivery-receipt-confirmation')
		    .attr('data-client-message-indentifier', data.clientMessageIdentifier)
		    .attr('data-receiver-id', window.chatData.id);
		  li.append([name, clientTime, deliveryConfirmation, deliveryReceiptConfirmation, message]);
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