document.addEventListener('DOMContentLoaded', () => {
    const socket = io({
      reconnection: false,
    });
    const senderName = "Player";

    const lobbySelect = document.getElementById('lobbySelect');
    const joinButton = document.getElementById('joinButton');
    const createButton = document.getElementById('createButton');

    socket.on('reconnect', () => {
      const lobbyId = socket.request.session.lobbyId;
    
      // Check if the user was part of a lobby before the refresh
      if (lobbyId) {
        // Handle rejoining the lobby
        socket.emit('join-lobby', lobbyId);
      }
    });

    socket.on('player-connection', ({ playerIndex, lobbyId }) => {
      console.log(`Player ${playerIndex} connected in lobby ${lobbyId}`);
      
      // Additional logic to handle player connection
      const connectedStatus = document.querySelector(`.player.p${playerIndex + 1} .connected`);
      
      console.log(lobbyId);

      if (connectedStatus && isNumeric(lobbyId)) {
        // Check if the connected status is not already active
        if (!connectedStatus.classList.contains('active')) {
          connectedStatus.classList.add('active');
        }
      }
    });

    // Emit a request for the existing lobbies when the page loads
    socket.emit('request-lobbies');
  
    // Handle the list of available lobbies
    socket.on('lobbies-list', (lobbies) => {
      // Clear existing options
      while (lobbySelect.firstChild) {
        lobbySelect.removeChild(lobbySelect.firstChild);
      }
    
      // Add a default option
      const defaultOption = document.createElement('option');
      defaultOption.text = 'Select or Create Lobby';
      defaultOption.value = '';
      lobbySelect.add(defaultOption);
    
      // Add options for each lobby
      for (const lobby of lobbies) {
        const option = document.createElement('option');
        option.text = `Lobby ${lobby.id} (${lobby.players}/${lobby.maxPlayers})`;
        option.value = lobby.id;
        lobbySelect.add(option);
      }
    });
  
    // Handle the 'Join Lobby' button click
    joinButton.addEventListener('click', () => {
      const selectedLobbyId = lobbySelect.value;
  
      if (selectedLobbyId) {
        socket.emit('join-lobby', selectedLobbyId);
  
        // Handle server responses if needed (e.g., lobby-full)
        socket.on('player-info', (info) => {
          console.log(`Joined lobby ${info.lobbyId} as player ${info.playerIndex}`);
          const lobbyInfo = document.getElementById('lobby-info');
          lobbyInfo.innerText = `Lobby ID: ${info.lobbyId}`;
        });
  
        socket.on('lobby-full', () => {
          alert('The lobby is full. Please try another lobby.');
        });
      }
    });
  
    // Handle the 'Create Lobby' button click
    createButton.addEventListener('click', () => {
      socket.emit('create-lobby');
  
      // Handle server responses if needed
      socket.on('created-lobby', (info) => {
        console.log(`Created lobby ${info.lobbyId} as player ${info.playerIndex}`);
      });
    });
  
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