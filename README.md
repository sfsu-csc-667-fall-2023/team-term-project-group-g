# CSC667 - Internet App Design & DEV Fall 2023
[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-7f7980b617ed060a017424585567c406b6ee15c891e84e1186181d67ecf80aa0.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=12578946)

| Student      | Student Full Name |  Student SFSU Email   | GitHub Username |        Discord Username         |
|    :---:     |       :---:       |         :---:         |      :---:      |             :---:               |
|      #1      |     Alec Nagal    | anagal1@mail.sfsu.edu |    itsmeAlec    | aleccsucky/Alec Nagal(nickname) |
|    #2        |   Douglas Cheung  |   dcheung5@sfsu.edu   | NicholasRFrintz |       NicholasRFrintz           |
|    #3        |Vijayraj Tolnoorkar| vtolnoorkar@sfsu.edu  |    vijayt2001   | vj838/ Vijayraj Tolnoorkar      |
|    #4        |    Lajja Shah     |  lshah@mail.sfsu.edu  |    sl1908       |         dukebix                 |


|             Name of the Project               |                            URL of the Project                          | 
|                    :---:                      |                                 :---:                                  |
|   BattleShip                                    |                                                   |  

# How to run game (locally) setup
1. open project folder
2. open terminal in IDE
3. run "npm init -y" in ternminal
4. run "npm i express socket.io" in ternminal
5. run "npm i --save-dev nodemon" in ternminal
6. make sure in package.json
    "main": "server.js"
     "scripts": {
   "start": "node server",
   "dev": "nodemon server"

# Run game (locally)
1. "npm run dev" in terminal

# Postgres Database Setup
1.	Open a terminal or command prompt.
2.	Log in as the default PostgreSQL user (postgres):
Command: psql -U postgres -d postgres
3.	Create a new user (battleship) with a password (password) and the ability to create databases:
Command: CREATE USER battleship WITH PASSWORD 'password' CREATEDB;
4.	Check if the battleship role was successfully created:
Command: /du
5.	Quit the PostgreSQL prompt:
Command: \q
6.	Log in as the newly created user (battleship):
Command: psql -U battleship -d postgres
7.	Create a new database (logindb):
Command: CREATE DATABASE logindb;
8.	Check if the logindb database was successfully created:
Command: \l
9.	Connect to the logindb database:
Command: \c logindb



