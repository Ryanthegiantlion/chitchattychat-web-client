var SessionModel = function() {
	this.loadSession();
}

SessionModel.prototype = {

	loadSession: function() {
		this.userName = localStorage.getItem('userName');
		this.userId = localStorage.getItem('_id');
		this.updateTimeStamp(new Date(localStorage.getItem('lastMessageTimeStamp')));

		this.log();
	},

	log: function() {
		console.log(this.attributes)
	},

	updateTimeStamp: function(timeStamp) {
		console.log('updating timestamp2:' + timeStamp);
		this.lastMessageTimeStamp = new Date(timeStamp);

		if (window.socket) {
	 		window.socket.io.opts.query = this.getSocketQueryParameters();
		}
	},

	getSocketQueryParameters: function() {
		return "userId=" + this.userId + "&userName=" + this.userName + "&lastMessageTimeStamp=" + this.lastMessageTimeStamp.toJSON();
	}
}

module.exports = SessionModel