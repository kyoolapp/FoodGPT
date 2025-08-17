# main.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
import httpx
import os

app = FastAPI()

#HF_API_TOKEN = os.getenv("HF_API_TOKEN")


# CORS middleware to connect frontend and backend running on different ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "FoodGPT backend is running"}

@app.post("/generate-recipe/")
async def generate_recipe(request: Request): 
    data = await request.json() 
    ingredients = data.get("ingredients") 
    oven_option = data.get("oven_option")
    time_option = data.get("time_option")
    if not ingredients: return {"error": "No ingredients provided."} 
    oven_text = ""
    time_text=""
    if oven_option:
        oven_text = f" this recipe should be prepared {'with' if oven_option == 'with' else 'without'} an oven"
        time_text = f" and I got {time_option} minutes"

    prompt = f"Suggest a healthy recipes using only the following ingredients: {ingredients}.{oven_text},{time_text}. Also include estimated calories and nutritional values." 
    #print("DEBUG prompt:", prompt)
    async with httpx.AsyncClient(timeout=240) as client: 
        response = await client.post( 
       f"http://localhost:11434/api/generate", 
            json={
                "model": "llama3.2",
                "prompt": prompt,
                "stream": False
            }
        )
 
    result = response.json() 
    
    return {"response": result.get("response", "No response received from LLaMA.")}