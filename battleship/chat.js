document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const senderName = "Player";
  
    // Handle sending messages
    document.getElementById('send').addEventListener('click', () => {
      const message = document.getElementById('enter-message').value;
      if (message.trim() !== '') {
        const fullMessage = `${senderName}: ${message}`;
        socket.emit('chat-content', fullMessage);
        document.getElementById('enter-message').value = '';
      }
    });
  
    // Handle receiving messages
    socket.on('chat-content', (message) => {
      const messagesDiv = document.getElementById('messages');
      const messageElement = document.createElement('p');
      messageElement.textContent = message;
      messagesDiv.appendChild(messageElement);
    });
  });