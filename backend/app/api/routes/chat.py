import json
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.llm import get_llm
from app.services.file_service import FileService
from app.schemas.chat import ChatRequest, ChatResponse, ModelInfo
from app.api.deps import CurrentUser, DbSession
from app.core.security import decode_token
from app.services.user_service import UserService
from app.core.permissions import can_access_project

router = APIRouter(prefix="/chat", tags=["AI Chat"])


@router.get("/model", response_model=ModelInfo)
def get_model_info(current_user: CurrentUser):
    """Get information about the AI model"""
    llm = get_llm()
    info = llm.get_model_info()
    return ModelInfo(**info)


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: CurrentUser,
    db: DbSession
):
    """
    Send a message and get a complete response.
    For non-streaming use cases.
    """
    llm = get_llm()

    # Get file context if provided
    context = ""
    if request.file_id and request.project_id:
        # Verify project access
        if not can_access_project(current_user, request.project_id, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to project"
            )

        file_service = FileService(db)
        try:
            content, file_record = file_service.get_file_content_as_text(request.file_id)
            context = f"File: {file_record.filename}\n\n{content}"
        except (FileNotFoundError, UnicodeDecodeError):
            pass

    response = await llm.generate(request.message, context)

    return ChatResponse(
        message=response,
        model=llm.get_model_info()["model"]
    )


@router.websocket("/ws")
async def chat_websocket(
    websocket: WebSocket,
    token: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for streaming chat responses.

    Client sends: {"message": "...", "project_id": 1, "file_id": 1}
    Server sends:
        {"type": "start", "model": "..."}
        {"type": "token", "content": "..."}
        {"type": "end", "full_response": "..."}
    """
    # Validate token
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=4001, reason="Invalid token payload")
        return

    user_service = UserService(db)
    user = user_service.get_by_id(user_id)
    if not user or not user.is_active:
        await websocket.close(code=4001, reason="User not found or inactive")
        return

    await websocket.accept()
    llm = get_llm()

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)

            prompt = message_data.get("message", "")
            project_id = message_data.get("project_id")
            file_id = message_data.get("file_id")

            # Get file context if provided
            context = ""
            if file_id and project_id:
                if can_access_project(user, project_id, db):
                    file_service = FileService(db)
                    try:
                        content, file_record = file_service.get_file_content_as_text(file_id)
                        context = f"File: {file_record.filename}\n\n{content}"
                    except (FileNotFoundError, UnicodeDecodeError):
                        pass

            # Send start message
            await websocket.send_json({
                "type": "start",
                "model": llm.get_model_info()["model"],
                "timestamp": datetime.utcnow().isoformat()
            })

            # Stream response
            full_response = ""
            async for token in llm.stream(prompt, context):
                full_response += token
                await websocket.send_json({
                    "type": "token",
                    "content": token
                })

            # Send end message
            await websocket.send_json({
                "type": "end",
                "full_response": full_response,
                "timestamp": datetime.utcnow().isoformat()
            })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
        await websocket.close()
