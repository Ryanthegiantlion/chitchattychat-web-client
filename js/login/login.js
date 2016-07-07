var chat = require('../chat/chat')

console.log('running login module');

function initLogin()
{
  $('#signinForm').submit(function() {
    var name = $('#inputEmail').val().toLowerCase();
    $.ajax({
        url: apiUrl + '/users',
        dataType: "json",
        contentType: "application/json; charset=UTF-8",
        data: JSON.stringify({userName: name}),
        type: "POST"
      })
      .done(function(data, testStatus,jqXHR) {
        localStorage.setItem('userName', data.userName);
        localStorage.setItem('_id', data._id);
        $('#content').html($('#chat').html())
        chat.initChat();
      })
      .fail(function() {
        console.log( "failure to create user" );
      })
      .always(function() {
        console.log( "completed signup post" );
    });
    return false;
  });
}

module.exports = { initLogin }