# main.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
import httpx
import os
from google.cloud import firestore
import datetime

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

db = firestore.Client.from_service_account_json("../keys/foodgpt-468206-c3e7e967c31b.json")



@app.post("/generate-recipe/")
async def generate_recipe(request: Request): 
    data = await request.json() 
    ingredients = data.get("ingredients") 
    oven_option = data.get("oven_option")
    time_option = data.get("time_option")
    serving_option = data.get("serving_option", 1)  # Default to 1 serving if not provided
    user_id = data.get("user_id","guest")
    if not ingredients: return {"error": "No ingredients provided."} 
    oven_text = ""
    time_text=""
    serving_text= ""
    if oven_option:
        oven_text = f" this recipe should be prepared {'with' if oven_option == 'with' else 'without'} an oven"
        time_text = f" and I got {time_option} minutes"
        serving_text = f" for {serving_option} serving{'s' if serving_option > 1 else ''}"

    prompt = (
        f"Suggest a healthy recipe using only the following ingredients: {ingredients}. {oven_text}, {serving_text} {time_text}.\n"
        "Also include estimated calories and nutritional values.\n\n"
        "Return the answer strictly in this JSON format, no extra text:\n\n"
        "{\n"
        '  "recipe_name": "<recipe name>",\n'
        '  "ingredients": ["item1", "item2", "item3"],\n'
        '  "instructions": ["step1", "step2", "step3"],\n'
        '  "estimated_calories": "<calories>",\n'
        '  "nutritional_values": {\n'
        '      "protein": "<g>",\n'
        '      "fat": "<g>",\n'
        '      "carbohydrates": "<g>",\n'
        '      "sugar": "<g>",\n'
        '      "fiber": "<g>"\n'
        "  }\n"
        "}\n"
    ) 
    print("DEBUG prompt:", prompt)
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
    recipe_response = result.get("response", "No response received from LLaMA.")

    entry = {
        "ingredients": ingredients,
        "oven_option": oven_option,
        "time_option": time_option,
        "response": recipe_response,
        "times": datetime.datetime.utcnow().isoformat(),
        "serving": serving_option,
        "user_id": user_id,
    }
    db.collection("user-foodgpt").add(entry)

    return {"response": recipe_response}

@app.get("/history/{user_id}")
def get_history(user_id: str):
        """
        Fetch all past recipe generations for a given user.
        """
        docs = (
        db.collection("user-foodgpt") \
        .order_by("times",direction=firestore.Query.DESCENDING) \
        .where("user_id", "==", user_id) \
        .limit(3) \
        .stream()
    )
        history = []
        for doc in docs:
            item = doc.to_dict()
            item["id"] = doc.id
            history.append(item)

        return {"history": history}