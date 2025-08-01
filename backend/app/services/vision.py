from ultralytics import YOLO
import cv2
import tempfile
import os

# Load YOLOv8 model
model = YOLO("yolov8n.pt")  # Use food-trained model later for better accuracy

FOOD_CLASSES = {
    "banana", "apple", "orange", "tomato", "broccoli", "carrot",
    "egg", "onion", "lettuce", "chicken", "fish", "bread",
    "milk", "cheese", "rice", "potato", "pepper", "mushroom"
}

def extract_ingredients_from_image(image_file):
    # Save uploaded image temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        tmp.write(image_file.read())
        tmp_path = tmp.name

    results = model(tmp_path)
    os.remove(tmp_path)  # clean up

    ingredients = set()

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            name = model.names[cls_id]
            if name in FOOD_CLASSES:
                ingredients.add(name)

    return list(ingredients)
