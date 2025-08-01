# main.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
import httpx

app = FastAPI()

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
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.2",
                "prompt": prompt,
                "stream": False
            }
        )

    result = response.json()
    return {"response": result.get("response", "No response received from LLaMA.")}
