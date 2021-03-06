// A generlisation of a DirectMessage/ Group
var ChannelsModel = function() {
	this.loadChannels();

  this.currentChannel =  {type: "Group", chatId: 0, userId: null, name: " General"};
  this.onlineStatuses = {}
  this.typingStatuses = {}
}

ChannelsModel.prototype = {
	loadChannels: function() {
		this.users = JSON.parse(localStorage.getItem('users:' + app.session.userId)) || []
	},

	saveChannels: function() {
		localStorage.setItem('users:' + app.session.userId, JSON.stringify(this.users));
	},	

	markChannelAsUnread: function(chatId) {
		var existingUser = this.users.find(function(item){ return item.chatId == chatId});
	    if (existingUser) {
	      existingUser.hasUnreadMessages = true;
	    }

	    this.saveChannels();

		$(this).trigger('change');
	},

	changeCurrentChannel: function(currentChannel) {
		this.currentChannel = currentChannel;

		var selectedChatId = currentChannel.chatId;
	    var selectedUser = app.channelsModel.users.find(function(item) { return item.chatId == selectedChatId});
	    if (selectedUser) {
	      selectedUser.hasUnreadMessages = false;
	    }
	    
	    this.saveChannels();

		$(this).trigger('change:selected');
	},

	sync: function() {
		$.ajax({
      		url: apiUrl + '/users',
      		headers: {
      			UserId: app.session.userId,
      		},
      		contentType: "application/json; charset=UTF-8",
	    })
	    .done(function(data, testStatus,jqXHR) {
	      data.forEach(function(user){
	        if (!app.channelsModel.users.find(function(cachedUser){return cachedUser._id == user._id})) {
	          app.channelsModel.users.push(user);
	        }
	      });
	      localStorage.setItem('users:' + app.session.userId, JSON.stringify(app.channelsModel.users));
	      app.channelsView.renderChannels();
	    })
	    .fail(function() {
	      console.log( "failure to get users" );
	    })
	    .always(function() {
	      console.log( "completed getting users" );
	  });
	},

	log: function() {
		console.log(this.attributes)
	}
}

module.exports = ChannelsModel