var chat = require('./chat/chat')
var login = require('./login/login')

console.log('initting . . .')
var userName = localStorage.getItem('userName')
if (userName)
{
  $('#content').html($('#chat').html())
  chat.initChat();
}
else 
{
  $('#content').html($('#login').html())
  login.initLogin();
} 