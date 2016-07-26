var ChannelsView = function(channelsModel, messagesModel){
	this.channelsModel = channelsModel;
	this.messagesModel = messagesModel;

	this.bindModelEvents();
	this.bindDomEvents();
}

ChannelsView.prototype = {
	// TODO: Lets remove this and add it to the render
	// The problem with removing this at the moment is that the render does not cover the 
	// broadcast channels. So the selected highlight hangs around.
	changeSelectedTab: function()
	{
	  $('.selected').removeClass('selected');
	  $('a[data-chat-id="' + app.channelsModel.currentChannel.chatId + '"]').addClass('selected');
	},

	bindModelEvents: function() {
		$(this.messagesModel).on('messageAdded', (e, data) => {
			if (data.chatId != app.channelsModel.currentChannel.chatId) {
				this.channelsModel.markChannelAsUnread(data.chatId);
	  	}
		});

		$(this.channelsModel).on('change', (e, data) => {
			this.renderChannels();
		});

		$(this.channelsModel).on('change:selected', (e, data) => {
			this.changeSelectedTab();
		});
	},

	bindDomEvents: function() {
		$( ".groups-container" ).click((e) => {
	    	this.channelsModel.changeCurrentChannel({type: "Group", chatId: 0, userId: null, name: " General"});

	    	console.log(this.channelsModel.currentChannel);
		 });

		$( ".users-container" ).click((e) => {
			this.channelsModel.changeCurrentChannel({type: "DirectMessage", chatId: $(e.target).attr('data-chat-id'), userId: $(e.target).attr('data-user-id'), name: $(e.target).html()});

	    	app.channelsView.renderChannels();

	    	console.log(this.channelsModel.currentChannel);
	  });

		$('.logout').click(function(e) {
	  		localStorage.clear();
	    	window.socket.disconnect();
	    	window.location.reload();
		}) 
	},

	renderChannels: function() {
		$('.users-container').html('');


	  app.channelsModel.users.forEach(function(item){

	  	app.messagesModel.addChat(item.chatId);

	    if (item._id != app.session.userId) {
	      var userLinkText = $('<span>').attr('data-user-id', item._id).attr('data-chat-id', item.chatId).text(item.userName);

	      var activityIcon = $('<span>').attr('data-user-id', item._id).attr('data-chat-id', item.chatId).addClass('fa').addClass('indicator-icon');

	      var isCurrentlyTyping = $('<span>').attr('data-user-id', item._id).attr('data-chat-id', item.chatId).addClass('typing-indicator').html('...');

	      if (!(item._id in app.channelsModel.onlineStatuses)) {
	        activityIcon.addClass('fa-circle-o').addClass('offline');
	      }
	      else {
	        activityIcon.addClass('fa-circle').addClass('online');
	      }

	      var userLink = $('<a>')
	        .attr('href', 'javascript:;')
	        .attr('data-user-id', item._id).attr('data-chat-id', item.chatId);

	      if (app.channelsModel.currentChannel.chatId == item.chatId) {
	        userLink.addClass('selected');
	      }

	      if (app.channelsModel.typingStatuses[item._id]) {
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