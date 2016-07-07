var SessionModel = function() {
	this.loadSession();
}

SessionModel.prototype = {

	loadSession: function() {
		this.userName = localStorage.getItem('userName');
		this.userId = localStorage.getItem('_id');
		this.lastMessageTimeStamp = new Date(localStorage.getItem('lastMessageTimeStamp'));

		this.log();
	},

	log: function() {
		console.log(this.attributes)
	}
}

module.exports = SessionModel