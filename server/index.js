import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure saves directory exists
const savesDir = path.join(__dirname, '../saves');
if (!fs.existsSync(savesDir)) {
    fs.mkdirSync(savesDir, { recursive: true });
}

// API Routes

// Save a recording
app.post('/api/recordings', async (req, res) => {
    try {
        const { name, data } = req.body;
        
        if (!name || !data) {
            return res.status(400).json({ error: 'Name and data are required' });
        }

        const fileName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        const filePath = path.join(savesDir, fileName);

        const recordingData = {
            name,
            timestamp: Date.now(),
            generations: data.generations,
            settings: data.settings,
            totalGenerations: data.generations.length
        };

        await fs.promises.writeFile(filePath, JSON.stringify(recordingData, null, 2));
        
        res.json({ 
            success: true, 
            fileName,
            message: `Recording "${name}" saved successfully`
        });
    } catch (error) {
        console.error('Error saving recording:', error);
        res.status(500).json({ error: 'Failed to save recording' });
    }
});

// Get all recordings
app.get('/api/recordings', async (req, res) => {
    try {
        const files = await fs.promises.readdir(savesDir);
        const recordings = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const filePath = path.join(savesDir, file);
                    const data = await fs.promises.readFile(filePath, 'utf8');
                    const recording = JSON.parse(data);
                    recordings.push({
                        id: file,
                        name: recording.name,
                        timestamp: recording.timestamp,
                        totalGenerations: recording.totalGenerations,
                        date: new Date(recording.timestamp).toLocaleDateString(),
                        time: new Date(recording.timestamp).toLocaleTimeString()
                    });
                } catch (error) {
                    console.error(`Error reading file ${file}:`, error);
                }
            }
        }

        // Sort by timestamp descending (newest first)
        recordings.sort((a, b) => b.timestamp - a.timestamp);
        res.json(recordings);
    } catch (error) {
        console.error('Error listing recordings:', error);
        res.status(500).json({ error: 'Failed to list recordings' });
    }
});

// Get a specific recording
app.get('/api/recordings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const filePath = path.join(savesDir, id);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Recording not found' });
        }

        const data = await fs.promises.readFile(filePath, 'utf8');
        const recording = JSON.parse(data);
        
        res.json(recording);
    } catch (error) {
        console.error('Error loading recording:', error);
        res.status(500).json({ error: 'Failed to load recording' });
    }
});

// Delete a recording
app.delete('/api/recordings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const filePath = path.join(savesDir, id);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Recording not found' });
        }

        await fs.promises.unlink(filePath);
        res.json({ success: true, message: 'Recording deleted successfully' });
    } catch (error) {
        console.error('Error deleting recording:', error);
        res.status(500).json({ error: 'Failed to delete recording' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: Date.now() });
});

app.listen(PORT, () => {
    console.log(`🚀 Game of Life Server running on port ${PORT}`);
    console.log(`📁 Saves directory: ${savesDir}`);
});
