from flask import Flask, render_template, request, jsonify, send_from_directory, send_file
import os
import sqlite3
import uuid
from datetime import datetime
import shutil

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['DATABASE'] = 'music.db'
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200MB max file size
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Create directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def init_database():
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_type TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    return conn

# Initialize database
init_database()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)

@app.route('/api/songs', methods=['GET'])
def get_songs():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM songs ORDER BY created_at DESC')
        songs = cursor.fetchall()
        conn.close()
        
        songs_list = []
        for song in songs:
            # تحقق من وجود الملف
            file_exists = os.path.exists(song['file_path'])
            
            songs_list.append({
                'id': song['id'],
                'title': song['title'],
                'file_path': f"/uploads/{os.path.basename(song['file_path'])}",
                'file_type': song['file_type'],
                'created_at': song['created_at'],
                'exists': file_exists
            })
        
        return jsonify(songs_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_song():
    try:
        print("Upload request received")  # Debug
        print(f"Files: {request.files}")  # Debug
        
        if 'file' not in request.files:
            print("No file in request")  # Debug
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        print(f"File: {file.filename}")  # Debug
        
        if file.filename == '':
            print("Empty filename")  # Debug
            return jsonify({'error': 'No file selected'}), 400
        
        # Get title from form or use filename
        title = request.form.get('title', '').strip()
        if not title:
            title = os.path.splitext(file.filename)[0]
        
        print(f"Title: {title}")  # Debug
        
        # Validate file type
        allowed_extensions = {'mp3', 'mp4'}
        file_ext = os.path.splitext(file.filename)[1][1:].lower()
        
        if file_ext not in allowed_extensions:
            print(f"Invalid extension: {file_ext}")  # Debug
            return jsonify({'error': 'File type not allowed. Only MP3 and MP4 are supported.'}), 400
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4().hex}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_ext}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        print(f"Saving to: {file_path}")  # Debug
        
        # Save file
        file.save(file_path)
        
        # Verify file was saved
        if not os.path.exists(file_path):
            print("File not saved successfully")  # Debug
            return jsonify({'error': 'Failed to save file'}), 500
        
        file_size = os.path.getsize(file_path)
        print(f"File saved successfully. Size: {file_size} bytes")  # Debug
        
        # Save to database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO songs (title, file_path, file_type) VALUES (?, ?, ?)',
            (title, file_path, file_ext)
        )
        conn.commit()
        song_id = cursor.lastrowid
        conn.close()
        
        print(f"Saved to database with ID: {song_id}")  # Debug
        
        # Get the newly created song
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM songs WHERE id = ?', (song_id,))
        new_song = cursor.fetchone()
        conn.close()
        
        return jsonify({
            'id': new_song['id'],
            'title': new_song['title'],
            'file_path': f"/uploads/{os.path.basename(new_song['file_path'])}",
            'file_type': new_song['file_type'],
            'message': 'Song uploaded successfully'
        })
        
    except Exception as e:
        print(f"Upload error: {str(e)}")  # Debug
        return jsonify({'error': str(e)}), 500

@app.route('/uploads/<filename>')
def serve_file(filename):
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Security check
        if '..' in filename or filename.startswith('/'):
            return 'Forbidden', 403
        
        if not os.path.exists(file_path):
            return 'File not found', 404
            
        return send_file(file_path)
    except Exception as e:
        return str(e), 500

@app.route('/api/delete/<int:song_id>', methods=['DELETE'])
def delete_song(song_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get file path
        cursor.execute('SELECT file_path FROM songs WHERE id = ?', (song_id,))
        song = cursor.fetchone()
        
        if not song:
            conn.close()
            return jsonify({'error': 'Song not found'}), 404
        
        # Delete file
        file_path = song['file_path']
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"Deleted file: {file_path}")
            except Exception as e:
                print(f"Error deleting file: {e}")
        
        # Delete from database
        cursor.execute('DELETE FROM songs WHERE id = ?', (song_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Song deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clear', methods=['DELETE'])
def clear_all():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all files
        cursor.execute('SELECT file_path FROM songs')
        songs = cursor.fetchall()
        
        # Delete all files
        for song in songs:
            file_path = song['file_path']
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass
        
        # Clear database
        cursor.execute('DELETE FROM songs')
        conn.commit()
        
        # Reset autoincrement
        cursor.execute('DELETE FROM sqlite_sequence WHERE name="songs"')
        conn.commit()
        
        conn.close()
        
        return jsonify({'message': 'All songs deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'uploads_folder': os.path.exists(app.config['UPLOAD_FOLDER'])})

if __name__ == '__main__':
    print("=" * 50)
    print("Music Hub Server Starting...")
    print(f"Upload folder: {app.config['UPLOAD_FOLDER']}")
    print(f"Absolute path: {os.path.abspath(app.config['UPLOAD_FOLDER'])}")
    print(f"Database: {app.config['DATABASE']}")
    print(f"Server running at http://localhost:5000")
    print("=" * 50)
    
    # Create uploads folder if it doesn't exist
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
        print(f"Created uploads folder: {app.config['UPLOAD_FOLDER']}")
    
    # Ensure the folder is writable
    test_file = os.path.join(app.config['UPLOAD_FOLDER'], 'test.txt')
    try:
        with open(test_file, 'w') as f:
            f.write('test')
        os.remove(test_file)
        print("Uploads folder is writable")
    except Exception as e:
        print(f"Uploads folder is not writable: {e}")
    
    app.run(debug=True, host='0.0.0.0', port=5000)