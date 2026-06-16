import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        
        # Atom Namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns)
            title_text = title.text if title is not None else ""
            
            updated = entry.find('atom:updated', ns)
            updated_text = updated.text if updated is not None else ""
            
            link = entry.find('atom:link', ns)
            link_url = ""
            if link is not None:
                link_url = link.attrib.get('href', '')
                
            content = entry.find('atom:content', ns)
            content_html = content.text if content is not None else ""
            
            entries.append({
                'title': title_text,
                'updated': updated_text,
                'link': link_url,
                'content': content_html
            })
            
        return jsonify({
            'status': 'success',
            'entries': entries
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
