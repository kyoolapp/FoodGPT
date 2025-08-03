# main.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
import httpx
import os

app = FastAPI()

HF_API_TOKEN = os.getenv("HF_API_TOKEN")

# CORS middleware to connect frontend and backend running on different ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://food-gpt-blush.vercel.app/"],  # Or specify your frontend URL
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
            # ✅ Switch to Hugging Face API endpoint
            "https://api-inference.huggingface.co/models/llama3.2",
            headers={
                # ✅ Inject secure Authorization header
                "Authorization": f"Bearer {HF_API_TOKEN}"
            },
            json={
                "inputs": prompt
            }
        )

    result = response.json()
    return {"response": result.get("generated_text", "No response received from LLaMA.")}
