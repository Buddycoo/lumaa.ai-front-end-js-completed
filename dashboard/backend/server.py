from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import os
import atexit
import uvicorn
import httpx
import json

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
NODE_SERVER_URL = "http://localhost:4001"

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

@app.get("/health")
async def health():
    return {"status": "ok", "service": "fastapi-wrapper", "backend": "node-express", "proxy_target": NODE_SERVER_URL}

# Proxy all API requests to Node.js server
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_api(request: Request, path: str):
    """Proxy all /api requests to the Node.js Express server"""
    try:
        # Get request body
        body = await request.body()
        
        # Prepare headers (exclude host)
        headers = dict(request.headers)
        headers.pop('host', None)
        
        # Make request to Node.js server
        url = f"{NODE_SERVER_URL}/api/{path}"
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                params=dict(request.query_params)
            )
        
        # Return the response from Node.js server
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=dict(response.headers)
        )
        
    except httpx.RequestError as e:
        print(f"Proxy error: {e}")
        raise HTTPException(status_code=503, detail="Backend service unavailable")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Catch-all route for non-API requests
@app.get("/{path:path}")
async def catch_all(path: str):
    return {
        "message": f"This is a FastAPI proxy. API requests should use /api/ prefix.",
        "node_server": NODE_SERVER_URL,
        "requested_path": path
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)