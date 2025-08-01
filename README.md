This is the prototype of foodgpt. I have started with the backend and right now, it's running as a server. 
I created a test frontend and connected with the backend now.


How to run?
First open two terminals, one for frontend and one for backend. 
Run the frontend using "npm start" like usual, inside the frontend directory.

To run the backend:
1. Go to the backend directory
2. Activate a python virtual environment using "venv/Scripts/activate" command and go into the directory where main.py is located.
3. Then run the "uvicorn main:app --reload" command to start the backend server running. 
4. You can now access the backend server at "http://127.0.0.1:8000

Now open powershell, and get llama running, using "ollama serve" command. 

Now you can input and use the model for now. 