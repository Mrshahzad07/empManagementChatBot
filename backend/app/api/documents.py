from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_hr_or_admin
from app.models.employee import Employee
from app.models.misc import Document
from app.schemas.misc import DocumentOut
from app.services.audit_service import log_action
import os, shutil
from app.core.config import settings
from datetime import datetime

router = APIRouter(prefix="/documents", tags=["Document Center"])


@router.get("", response_model=List[DocumentOut])
async def get_documents(
    doc_type: Optional[str] = None,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Document).filter(
        Document.employee_id == current_user.id,
        Document.status == "active"
    )
    if doc_type:
        query = query.filter(Document.document_type == doc_type)

    docs = query.order_by(Document.created_at.desc()).all()
    return [DocumentOut(
        id=d.id,
        document_type=d.document_type,
        document_name=d.document_name,
        description=d.description,
        financial_year=d.financial_year,
        download_count=d.download_count,
        status=d.status,
        created_at=d.created_at
    ) for d in docs]


@router.get("/{doc_id}/download")
async def download_document(
    doc_id: int,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Access control
    if doc.employee_id and doc.employee_id != current_user.id:
        if current_user.role.name not in ("hr", "admin"):
            raise HTTPException(status_code=403, detail="Access denied")

    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found")

    doc.download_count += 1
    db.commit()

    await log_action(db, current_user.id, "document_download", "document", str(doc_id),
                    f"Downloaded document: {doc.document_name}")

    return FileResponse(
        doc.file_path,
        media_type=doc.mime_type or "application/pdf",
        filename=doc.file_name or doc.document_name,
        headers={"Content-Disposition": f"attachment; filename={doc.file_name or doc.document_name}"}
    )


@router.post("/upload", dependencies=[Depends(require_hr_or_admin)])
async def upload_document(
    employee_id: Optional[int] = Form(None),
    document_type: str = Form(...),
    document_name: str = Form(...),
    description: Optional[str] = Form(None),
    financial_year: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    # Save file
    doc_dir = settings.documents_dir
    os.makedirs(doc_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = f"{timestamp}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(doc_dir, safe_name)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    file_size_kb = os.path.getsize(file_path) // 1024

    doc = Document(
        employee_id=employee_id,
        document_type=document_type,
        document_name=document_name,
        description=description,
        file_path=file_path,
        file_name=file.filename,
        file_size_kb=file_size_kb,
        mime_type=file.content_type or "application/pdf",
        financial_year=financial_year,
        uploaded_by=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    await log_action(db, current_user.id, "document_upload", "document", str(doc.id),
                    f"Uploaded document: {document_name} for employee {employee_id}")

    return {"message": "Document uploaded successfully", "document_id": doc.id}


from pydantic import BaseModel
import io

class GenerateDraftRequest(BaseModel):
    document_type: str
    employee_details: dict
    requirements: str

class SaveGeneratedRequest(BaseModel):
    employee_id: int
    document_type: str
    document_name: str
    content: str

class DownloadGeneratedRequest(BaseModel):
    document_name: str
    content: str

def create_pdf_from_text(text: str, file_path_or_buffer):
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    
    doc = SimpleDocTemplate(file_path_or_buffer, pagesize=letter,
                            rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=18)
    styles = getSampleStyleSheet()
    style = styles["Normal"]
    style.fontSize = 11
    style.leading = 14
    
    import re
    
    story = []
    # Replace basic markdown
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    # Simple parse
    for paragraph in text.split('\n\n'):
        if paragraph.strip():
            story.append(Paragraph(paragraph.replace('\n', '<br/>'), style))
            story.append(Spacer(1, 12))
            
    doc.build(story)

@router.post("/generate-draft", dependencies=[Depends(require_hr_or_admin)])
async def generate_draft(
    request: GenerateDraftRequest,
    current_user: Employee = Depends(require_hr_or_admin)
):
    from groq import Groq
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
        
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    system_prompt = (
        "You are an expert HR professional. "
        "Your task is to draft a formal HR document. "
        "Do not include any introductory or concluding remarks (like 'Here is the letter'), "
        "just the exact letter content. "
        "Use standard professional formatting."
    )
    
    details_str = "\n".join([f"- {k}: {v}" for k, v in request.employee_details.items() if v])
    user_prompt = (
        f"Document Type: {request.document_type}\n"
        f"Employee Details:\n{details_str}\n\n"
        f"Specific Requirements: {request.requirements}\n\n"
        "Please draft the document based on the above details."
    )
    
    try:
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=2048
        )
        return {"content": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate draft: {str(e)}")


@router.post("/save-generated", dependencies=[Depends(require_hr_or_admin)])
async def save_generated_document(
    request: SaveGeneratedRequest,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    doc_dir = settings.documents_dir
    os.makedirs(doc_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = f"{timestamp}_{request.document_name.replace(' ', '_')}.pdf"
    file_path = os.path.join(doc_dir, safe_name)
    
    # Generate PDF
    try:
        create_pdf_from_text(request.content, file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
        
    file_size_kb = os.path.getsize(file_path) // 1024
    
    doc = Document(
        employee_id=request.employee_id,
        document_type=request.document_type,
        document_name=request.document_name,
        description="Generated by AI Assistant",
        file_path=file_path,
        file_name=f"{request.document_name}.pdf",
        file_size_kb=file_size_kb,
        mime_type="application/pdf",
        uploaded_by=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    await log_action(db, current_user.id, "document_upload", "document", str(doc.id),
                    f"Generated and uploaded {request.document_name} for employee {request.employee_id}")
                    
    return {"message": "Document generated and saved successfully", "document_id": doc.id}


from fastapi.responses import StreamingResponse

@router.post("/download-generated", dependencies=[Depends(require_hr_or_admin)])
async def download_generated_document(
    request: DownloadGeneratedRequest,
    current_user: Employee = Depends(require_hr_or_admin)
):
    # Generate PDF into memory buffer
    buffer = io.BytesIO()
    try:
        create_pdf_from_text(request.content, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
        
    buffer.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="{request.document_name}.pdf"'
    }
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers=headers
    )
