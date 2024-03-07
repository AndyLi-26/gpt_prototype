from flask import Flask, request
import os
import shutil

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route('/upload-audio', methods=['POST'])
def upload_audio():
    print(request)
    print(request.files)
    if 'audio' not in request.files:
        return 'No file part'

    audio_file = request.files['audio']

    if audio_file.filename == '':
        return 'No selected file'

    try:
        # Save the audio file to a temporary location
        audio_path = os.path.join(app.config['UPLOAD_FOLDER'], audio_file.filename)
        audio_file.save(audio_path)

        # Convert the audio to MP3 format
        mp3_path = os.path.splitext(audio_path)[0] + '.mp3'
        os.system(f'ffmpeg -i {audio_path} {mp3_path}')

        # Read the MP3 file in binary format
        with open(mp3_path, 'rb') as file:
            binary_data = file.read()

        # Clean up: delete temporary files
        os.remove(audio_path)
        os.remove(mp3_path)

        return binary_data, 200, {'Content-Type': 'audio/mp3'}

    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    app.run(debug=False,host='0.0.0.0',port=5001)
