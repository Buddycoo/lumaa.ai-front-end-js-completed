from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import os
import signal
import atexit
import uvicorn

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store the subprocess
node_process = None

def start_node_server():
    """Start the Node.js Express server"""
    global node_process
    try:
        # Change to the dashboard backend directory and start the Node.js server
        os.chdir('/app/dashboard/backend')
        node_process = subprocess.Popen(['node', 'server.js'], 
                                      stdout=subprocess.PIPE, 
                                      stderr=subprocess.PIPE)
        print(f"Started Node.js server with PID: {node_process.pid}")
    except Exception as e:
        print(f"Failed to start Node.js server: {e}")

def stop_node_server():
    """Stop the Node.js Express server"""
    global node_process
    if node_process:
        try:
            node_process.terminate()
            node_process.wait(timeout=10)
            print("Node.js server stopped gracefully")
        except subprocess.TimeoutExpired:
            node_process.kill()
            print("Node.js server killed forcefully")
        except Exception as e:
            print(f"Error stopping Node.js server: {e}")

# Register cleanup function
atexit.register(stop_node_server)

@app.on_event("startup")
async def startup_event():
    """Start the Node.js server when FastAPI starts"""
    start_node_server()

@app.on_event("shutdown") 
async def shutdown_event():
    """Stop the Node.js server when FastAPI shuts down"""
    stop_node_server()

@app.get("/")
async def root():
    return {"message": "FastAPI wrapper running Node.js Express server on port 4001"}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "fastapi-wrapper", "backend": "node-express"}

# Catch-all route to inform about the Node.js server
@app.get("/{path:path}")
async def catch_all(path: str):
    return {
        "message": f"This is a FastAPI wrapper. The actual API is running on port 4001.",
        "node_api_url": "http://localhost:4001",
        "requested_path": path
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)