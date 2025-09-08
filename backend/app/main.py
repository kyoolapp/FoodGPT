# main.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
import httpx
import os
from google.cloud import firestore
import datetime
import json

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

db = firestore.Client.from_service_account_json("../keys/foodgpt-468206-aebce83d9326.json")



@app.post("/generate-recipe/")
async def generate_recipe(request: Request): 
    data = await request.json() 
    ingredients = data.get("ingredients") 
    mode=data.get("mode")
    oven_option = data.get("oven_option")
    time_option = data.get("time_option")
    serving_option = data.get("serving_option", 1)  # Default to 1 serving if not provided
    user_id = data.get("user_id","guest")
    oven_text = ""
    time_text=""
    serving_text= ""

    if mode=="dish":                                                                                                             
        dish_name = data.get("dish_name")
        if not dish_name: return {"error": "No dish name provided."}
        prompt = (
            f"You are a professional cookbook author. Suggest a healthy, complete AUTHENTIC recipe for the dish: {dish_name}. "
            "The recipe must strictly follow traditional preparation methods used in its authentic cuisine. "
            "Do not invent or include unrelated or unusual ingredients (for example: egg whites, coconut, lemon juice, baking soda) unless they are truly part of the authentic version of this dish. "
            "If the dish is traditionally vegetarian or vegan, keep it that way. "
            "Ensure the recipe contains only realistic, commonly available ingredients for this cuisine. "
            "Instructions must be step-by-step, detailed, and accurate, with realistic preparation and cooking times. "
            "Use U.S. kitchen units by default (tbsp, tsp, cups, oz) and add metric in parentheses when quantities are ≥ 100 g/ml. "
            "Do not skip essential steps or shorten the process unnaturally. "
            "Return strictly numbers only for nutritional values and calories (do not include units like 'g' or 'kcal'). "
            "If unsure, prefer omitting an ingredient over inventing one.\n\n"
            "Return the answer strictly in this JSON format, no extra text:\n\n"
            "{\n"
                '  "recipe_name": "string",\n'
                '  "serving": "number",\n'
                '  "time_option": "string",\n'
                '  "ingredients": ["string", "string", "string"],\n'
                '  "instructions": ["string", "string", "string"],\n'
                '  "estimated_calories": "number",\n'
                '  "nutritional_values": {\n'
                '      "protein": "number",\n'
                '      "fat": "number",\n'
                '      "carbohydrates": "number",\n'
                '      "sugar": "number",\n'
                '      "fiber": "number"\n'
            "  }\n"
            "}\n"
        )
    else:
        if not ingredients: return {"error": "No ingredients provided."} 
        if oven_option:
            oven_text = f" this recipe should be prepared {'with' if oven_option == 'with' else 'without'} an oven"
            time_text = f" and I got upto {time_option} minutes"
            serving_text = f" for {serving_option} serving{'s' if serving_option > 1 else ''}"

        prompt = (
        f"You are a professional cookbook author and food‑safety‑aware chef. You ALWAYS produce complete, structured, unambiguous recipes. You must follow the “Output contract” exactly and never omit required fields. Use U.S. kitchen units by default (tbsp, tsp, cups, oz) and add metric in parentheses when quantities are ≥ 100 g/ml. Assume the user wants vegetarian when possible if protein is unspecified. If essential ingredients are missing, propose close substitutes in a “Substitutions” field. If I need to buy some ingredients for the recipe to cook, suggest them in the instructions. If durations are missing, estimate conservative, realistic timings. Never invent nutrition claims beyond rough, per‑serving estimates. Suggest a common healthy recipe using only the following ingredients: {ingredients}. {oven_text}, {serving_text} {time_text}.\n"
        "Also include estimated calories and nutritional values in grams.(strictly numbers only, don't mention the unit).\n\n"
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
    #print("\n\nDEBUG prompt:", prompt)
    async with httpx.AsyncClient(timeout=120) as client: 
        response = await client.post( 
       f"http://localhost:11434/api/generate", 
            json={
                "model": "llama3.2",
                "prompt": prompt,
                "temperature": 0.2,
                "top_p": 0.9,
                "stream": False
            }
        )


    result = response.json() 
    recipe_response = result.get("response", "No response received from LLaMA.")
    #print("\n\nDEBUG llama response:", recipe_response)


    try:
        recipe_data = json.loads(recipe_response)
    except json.JSONDecodeError:
        # If LLaMA sends invalid JSON, fall back to raw string
        recipe_data = {"raw_response": recipe_response}


    #print("\n\nDEBUG recipe_data:", recipe_data)


    entry = {
        #"ingredients": ingredients,
        "oven_option": oven_option,
        #"time_option": time_option,
        #"response": recipe_response,
        "times": datetime.datetime.utcnow().isoformat(),
        #"serving": serving_option,
        "user_id": user_id,
        **recipe_data  # Unpack structured recipe fields directly
    }
    doc_ref = db.collection("user-foodgpt").add(entry)
    recipe_id=doc_ref[1].id
    print(f"\nStored recipe with ID: {recipe_id}\n\n")
    print(f"\nStored recipe data: {recipe_data}\n\n")

    return {"id":recipe_id,"response": recipe_data}

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

@app.get("/recipe/{recipe_id}")
def get_recipe_by_id(recipe_id: str):
    doc = db.collection("user-foodgpt").document(recipe_id).get()
    if doc.exists:
        data = doc.to_dict()
        data["id"] = doc.id
        print(f"\nFetched recipe data: {data}\n\n")
        return data
    return {"error": "Recipe not found."}
