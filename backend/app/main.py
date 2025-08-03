# main.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
import httpx
import os

app = FastAPI()


# Replace with your actual Hugging Face token
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "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")
HF_MODEL_URL = "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct"

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

    if not ingredients:
        return {"error": "No ingredients provided."}

    prompt = f"Suggest a healthy recipes using only the following ingredients: {ingredients}. Also include estimated calories and nutritional values."

    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            HF_MODEL_URL,
            headers={
                "Authorization": f"Bearer {HF_API_TOKEN}",
                "Content-Type": "application/json"
            },
            json={
                "inputs": prompt
            }
        )

    result = response.json()
    return {"response": result.get("response", "No response received from LLaMA.")}


