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
	  $('a[data-id="' + app.channelsModel.currentChannel.id + '"]').addClass('selected');
	},

	bindModelEvents: function() {
		$(this.messagesModel).on('messageAdded', (e, data) => {
			if (data.chatId != app.channelsModel.currentChannel.id) {
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
	    this.channelsModel.changeCurrentChannel({type: "Group", id: 0, name: " General"});
		 });

		$( ".users-container" ).click((e) => {
			this.channelsModel.changeCurrentChannel({type: "DirectMessage", id: $(e.target).attr('data-id'), name: $(e.target).html()});

	    app.channelsView.renderChannels();
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

	    if (!app.messagesModel.chatMessages[item._id]) {
	      app.messagesModel.chatMessages[item._id] = { messages: [] };
	    }
	    if (item._id != app.session.userId) {
	      var userLinkText = $('<span>').attr('data-id', item._id).text(item.userName);

	      var activityIcon = $('<span>').attr('data-id', item._id).addClass('fa').addClass('indicator-icon');

	      var isCurrentlyTyping = $('<span>').attr('data-id', item._id).addClass('typing-indicator').html('...');

	      if (!(item._id in app.channelsModel.onlineStatuses)) {
	        activityIcon.addClass('fa-circle-o').addClass('offline');
	      }
	      else {
	        activityIcon.addClass('fa-circle').addClass('online');
	      }

	      var userLink = $('<a>')
	        .attr('href', 'javascript:;')
	        .attr('data-id', item._id);

	      if (app.channelsModel.currentChannel.id == item._id) {
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