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


Log: 04:22- 12 Aug 2025
Right now the LLM and the backend is hosted on GCP VM, and it's running. 
if I turn it off and turn it on again, I need to change the external IP in the frontend. 

Also for now, the frontend in vercel is not working due to mixed content issues, i.e, vercel is running https, and the backend is running on http. We have to serve the backend on https to fix this issue. I need a domain name, or the subdomain of kyoolapp.com to fix this. 

The backend is working fine, if it connected to the frontend on my local machine, using npm start. 

When you start the VM, the backend should automatically run like llama. Also remember to change the IP in the frontend. 

Log: 18:18- 12 Aug 2025
The backend is served with https now. Redeploying it to vercel now.