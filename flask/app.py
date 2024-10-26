from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from PIL import Image
import numpy as np

app = Flask(__name__)
CORS(app)

classification_model = load_model('breast_cancer_classification_model.h5')
denoise_model = load_model('denoise_model.h5')

# Define class labels (replace with your actual class labels)
class_labels = ['normal', 'benign', 'malignant']

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    image = request.files['image']
    img = Image.open(image.stream)
    img = img.resize((224, 224))  # Adjust size to match your model's input size
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array /= 255.0  # Normalize the image

    prediction = classification_model.predict(img_array)
    predicted_class = class_labels[np.argmax(prediction)]
    confidence = float(np.max(prediction))

    return jsonify({
        'predicted_class': predicted_class,
        'confidence': confidence
    })

@app.route('/denoise', methods=['POST'])
def denoise():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    image = request.files['image']
    img = Image.open(image.stream)
    img = img.resize((128, 128))  # Resize to match the model's expected input size
    img = img.convert('L')  # Convert to grayscale if the model expects a single channel
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array /= 255.0  # Normalize the image

    # Get denoised image from the model
    denoised_array = denoise_model.predict(img_array)
    
    # Convert back to PIL Image
    denoised_array = (denoised_array[0] * 255).astype(np.uint8)
    denoised_image = Image.fromarray(denoised_array.squeeze(), mode='L')
    
    # Save to bytes
    from io import BytesIO
    img_byte_array = BytesIO()
    denoised_image.save(img_byte_array, format='PNG')
    img_byte_array = img_byte_array.getvalue()

    # Return the image as a response
    from flask import send_file
    return send_file(
        BytesIO(img_byte_array),
        mimetype='image/png'
    )

if __name__ == '__main__':
    app.run(debug=True)