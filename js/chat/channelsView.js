var ChannelsView = function(channelsModel, messagesModel){
	this.channelsModel = channelsModel;
	this.messagesModel = messagesModel;

	this.bindModelEvents();
}

ChannelsView.prototype = {
	bindModelEvents: function() {
		$(this.messagesModel).on('messageAdded', (e, data) => {
			if (data.chatId != window.chatData.id) {
				this.channelsModel.markChannelAsUnread(data.chatId);
	  	}
		});

		$(this.channelsModel).on('change', (e, data) => {
			this.renderChannels();
		});
	},

	renderChannels: function() {
		$('.users-container').html('');


	  app.channelsModel.users.forEach(function(item){

	    if (!app.messagesModel.chatMessages[item._id]) {
	      app.messagesModel.chatMessages[item._id] = { messages: [] };
	    }
	    if (item._id != app.session.userId) {
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
}

module.exports = ChannelsView;