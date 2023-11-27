$(() =>{
    $("#send").click(()=>{
      sendMessage({
        name: $("name").val(),
        message:$("message").val()});
    })
    getMessages()
  })
  
  function addMessages(message){
    $("#messages").append(`
    <h4>${message.name}</h4>
    <p> ${message.message}</p>`)
  }
  
  function getMessages(){
    $.get('http://localhost:3000/messages', (data) => {
      data.forEach(addMessages);
    })
  }
  
  function sendMessage(message){
    $.post('http://localhost:3000/messages', message)
  }
  
  var socket = io();
  
  socket.on('message', addMessages);