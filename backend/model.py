import torch
from torchvision import models, transforms
from PIL import Image

model = models.mobilenet_v2(pretrained=True)
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(   # ✅ IMPORTANT
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

def predict(image_path):
    try:
        img = Image.open(image_path).convert("RGB")
        img = transform(img).unsqueeze(0)
        with torch.no_grad():
            output = model(img)
        return output
    except Exception as e:
        return torch.zeros(1, 1000)  # fallback