"""
AI Tool Calling Layer.
All tools available to the AI for executing business actions.
"""

from datetime import date, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.leave import LeaveBalance, LeaveRequest, LeavePolicy
from app.models.salary import SalaryRecord, SalarySlip
from app.models.misc import Document, Notification, Announcement, ChatSession
from app.schemas.leave import LeaveApplyRequest
from app.schemas.salary import MONTH_NAMES
from app.services.leave_service import LeaveService
from app.services.salary_service import SalaryService
from app.services.notification_service import create_notification
from app.chatbot.intent_parser import parse_month_year, parse_financial_year


TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_leave_balance",
            "description": "Get the employee's leave balance for a given year. Use when employee asks about leaves remaining, leave balance, how many leaves are left, kitni chutti bachi hai, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "year": {
                        "type": "integer",
                        "description": "The year to check leave balance for. Default to current year."
                    },
                    "leave_type": {
                        "type": "string",
                        "description": "Optional specific leave type: annual, sick, casual, maternity, paternity, emergency, marriage, unpaid",
                        "enum": ["annual", "sick", "casual", "maternity", "paternity", "emergency", "marriage", "unpaid"]
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "apply_leave",
            "description": "Apply for leave on behalf of the employee. Use when employee wants to take leave, apply leave, needs a day off, need chutti, going on vacation, etc. Requires start_date, end_date, reason, and leave_type.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {
                        "type": "string",
                        "description": "Start date in YYYY-MM-DD format"
                    },
                    "end_date": {
                        "type": "string",
                        "description": "End date in YYYY-MM-DD format"
                    },
                    "leave_type": {
                        "type": "string",
                        "description": "Type of leave",
                        "enum": ["annual", "sick", "casual", "maternity", "paternity", "emergency", "marriage", "unpaid"]
                    },
                    "reason": {
                        "type": "string",
                        "description": "Reason for leave"
                    },
                    "half_day": {
                        "type": "boolean",
                        "description": "True if half day leave"
                    },
                    "is_emergency": {
                        "type": "boolean",
                        "description": "True if emergency leave without notice period"
                    }
                },
                "required": ["start_date", "end_date", "leave_type", "reason"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_leave_history",
            "description": "Get employee's leave request history. Use when employee asks about past leaves, leave history, leave status, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "description": "Filter by status: pending, approved, rejected, cancelled",
                        "enum": ["pending", "approved", "rejected", "cancelled"]
                    },
                    "year": {
                        "type": "integer",
                        "description": "Filter by year"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of records to return",
                        "default": 5
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_leave",
            "description": "Cancel an existing pending leave request. Use when an employee asks to cancel their leave, delete leave, chutti cancel kardo, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "leave_id": {
                        "type": "integer",
                        "description": "The ID of the leave request to cancel"
                    }
                },
                "required": ["leave_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_salary_slip",
            "description": "Get or generate a salary slip PDF for a specific month and year. Use when employee asks for salary slip, payslip, salary statement, March ka slip, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "month": {
                        "type": "integer",
                        "description": "Month number (1-12)"
                    },
                    "year": {
                        "type": "integer",
                        "description": "Year (e.g., 2025)"
                    }
                },
                "required": ["month", "year"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_salary_history",
            "description": "Get salary slip history for the employee. Use when employee asks for salary history, list of salary slips, all salary slips, salary of 2025, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "year": {
                        "type": "integer",
                        "description": "Filter by year"
                    },
                    "month_from": {
                        "type": "integer",
                        "description": "Starting month (1-12)"
                    },
                    "month_to": {
                        "type": "integer",
                        "description": "Ending month (1-12)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_document",
            "description": "Get a specific document for the employee. Use when they ask for offer letter, appointment letter, experience letter, Form 16, tax documents, certificates, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "document_type": {
                        "type": "string",
                        "description": "Type of document",
                        "enum": ["offer_letter", "appointment_letter", "experience_letter", "form16", "tax_document", "policy", "certificate", "id_card", "relieving_letter", "other"]
                    }
                },
                "required": ["document_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_documents",
            "description": "List all documents available for the employee. Use when employee asks to see their documents, 'show my documents', 'get my documents', etc.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_notifications",
            "description": "Get the employee's recent notifications. Use when they ask about notifications, updates, alerts, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "unread_only": {
                        "type": "boolean",
                        "description": "Only return unread notifications"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_announcements",
            "description": "Get company announcements. Use when employee asks about company news, announcements, updates, office updates, etc.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_pdf_letter",
            "description": "Generate a custom letter/document as a downloadable PDF. ALWAYS use this whenever the user asks you to write, draft, or create a letter, application, or document so they can download it as a PDF format.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The title of the document (e.g., Sick Leave Application, Cover Letter)"
                    },
                    "content": {
                        "type": "string",
                        "description": "The full, professional text content of the letter/document formatted clearly using basic markdown."
                    }
                },
                "required": ["title", "content"]
            }
        }
    },
]


class ToolExecutor:
    def __init__(self, db: Session, employee: Employee):
        self.db = db
        self.employee = employee

    async def execute(self, tool_name: str, tool_args: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a tool and return its result."""
        tool_map = {
            "get_leave_balance": self._get_leave_balance,
            "apply_leave": self._apply_leave,
            "get_leave_history": self._get_leave_history,
            "cancel_leave": self._cancel_leave,
            "get_salary_slip": self._get_salary_slip,
            "get_salary_history": self._get_salary_history,
            "get_document": self._get_document,
            "list_documents": self._list_documents,
            "get_notifications": self._get_notifications,
            "get_announcements": self._get_announcements,
            "generate_pdf_letter": self._generate_pdf_letter,
        }

        handler = tool_map.get(tool_name)
        if not handler:
            return {"error": f"Unknown tool: {tool_name}"}

        try:
            return await handler(**tool_args)
        except Exception as e:
            return {"error": str(e), "tool": tool_name}

    async def _get_leave_balance(self, year: Optional[int] = None, leave_type: Optional[str] = None) -> Dict:
        if not year:
            year = date.today().year

        query = self.db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == self.employee.id,
            LeaveBalance.year == year
        )
        if leave_type:
            query = query.filter(LeaveBalance.leave_type == leave_type)

        balances = query.all()
        if not balances:
            return {
                "status": "no_data",
                "message": f"No leave balance found for {year}. Please contact HR.",
                "year": year
            }

        result = []
        for b in balances:
            result.append({
                "leave_type": b.leave_type,
                "allocated": b.allocated,
                "used": b.used,
                "pending": b.pending,
                "remaining": b.remaining,
            })

        total_remaining = sum(b.remaining for b in balances)
        total_allocated = sum(b.allocated for b in balances)

        return {
            "status": "success",
            "year": year,
            "employee": self.employee.full_name,
            "total_remaining": total_remaining,
            "total_allocated": total_allocated,
            "balances": result
        }

    async def _apply_leave(
        self,
        start_date: str,
        end_date: str,
        leave_type: str,
        reason: str,
        half_day: bool = False,
        is_emergency: bool = False,
        half_day_session: Optional[str] = None
    ) -> Dict:
        from datetime import datetime as dt
        try:
            start = dt.strptime(start_date, "%Y-%m-%d").date()
            end = dt.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return {"status": "error", "message": "Invalid date format. Use YYYY-MM-DD."}

        request = LeaveApplyRequest(
            leave_type=leave_type,
            start_date=start,
            end_date=end,
            reason=reason,
            half_day=half_day,
            half_day_session=half_day_session,
            is_emergency=is_emergency
        )

        try:
            service = LeaveService(self.db)
            leave = await service.apply_leave(self.employee, request)

            # Notify HR
            hr_employees = self.db.query(Employee).filter(Employee.role_id == 2, Employee.is_active == True).all()
            for hr in hr_employees:
                await create_notification(
                    self.db, hr.id,
                    f"New Leave Request from {self.employee.full_name}",
                    f"{self.employee.full_name} has applied for {leave_type} leave from {start} to {end}. Reason: {reason}",
                    "leave_applied",
                    action_url="/hr/leave-approval"
                )

            return {
                "status": "success",
                "message": f"Leave applied successfully!",
                "leave_id": leave.id,
                "leave_type": leave_type,
                "start_date": str(start),
                "end_date": str(end),
                "total_days": float(leave.total_days),
                "reason": reason,
                "leave_status": "pending",
                "note": "Your leave request has been submitted and is pending HR approval."
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def _cancel_leave(self, leave_id: int) -> Dict:
        leave = self.db.query(LeaveRequest).filter(
            LeaveRequest.id == leave_id,
            LeaveRequest.employee_id == self.employee.id
        ).first()

        if not leave:
            return {"status": "error", "message": f"Leave request with ID {leave_id} not found."}
        if leave.status != "pending":
            return {"status": "error", "message": f"Only pending leave requests can be cancelled. Current status is {leave.status}."}

        # Restore pending balance
        balance = self.db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == self.employee.id,
            LeaveBalance.leave_type == leave.leave_type,
            LeaveBalance.year == leave.start_date.year
        ).first()
        if balance:
            balance.pending = max(0, balance.pending - int(leave.total_days))

        leave.status = "cancelled"
        self.db.commit()

        return {
            "status": "success",
            "message": f"Leave request #{leave_id} has been successfully cancelled.",
            "leave_id": leave_id
        }

    async def _get_leave_history(
        self,
        status: Optional[str] = None,
        year: Optional[int] = None,
        limit: int = 5
    ) -> Dict:
        query = self.db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == self.employee.id
        )
        if status:
            query = query.filter(LeaveRequest.status == status)
        if year:
            from datetime import date as d
            query = query.filter(
                LeaveRequest.start_date >= d(year, 1, 1),
                LeaveRequest.start_date <= d(year, 12, 31)
            )

        requests = query.order_by(LeaveRequest.applied_at.desc()).limit(limit).all()

        if not requests:
            return {
                "status": "no_data",
                "message": "No leave requests found.",
                "requests": []
            }

        result = [{
            "id": r.id,
            "leave_type": r.leave_type,
            "start_date": str(r.start_date),
            "end_date": str(r.end_date),
            "total_days": float(r.total_days),
            "status": r.status,
            "reason": r.reason,
            "applied_at": r.applied_at.strftime("%d %b %Y") if r.applied_at else None,
        } for r in requests]

        return {
            "status": "success",
            "total_found": len(result),
            "requests": result
        }

    async def _get_salary_slip(self, month: int, year: int) -> Dict:
        record = self.db.query(SalaryRecord).filter(
            SalaryRecord.employee_id == self.employee.id,
            SalaryRecord.month == month,
            SalaryRecord.year == year
        ).first()

        if not record:
            return {
                "status": "not_found",
                "message": f"Salary record for {MONTH_NAMES.get(month, 'Month')} {year} not found. Please contact HR.",
                "month": month,
                "year": year
            }

        return {
            "status": "success",
            "message": f"Salary slip for {MONTH_NAMES.get(month, 'Month')} {year} is ready for download.",
            "salary_record_id": record.id,
            "month": month,
            "month_name": MONTH_NAMES.get(month, ""),
            "year": year,
            "net_salary": record.net_salary,
            "gross_salary": record.gross_salary,
            "payment_status": record.payment_status,
            "download_url": f"/api/v1/salary/slips/{record.id}/download",
            "action": "download_salary_slip",
            "action_data": {"salary_record_id": record.id, "month": month, "year": year}
        }

    async def _get_salary_history(
        self,
        year: Optional[int] = None,
        month_from: Optional[int] = None,
        month_to: Optional[int] = None
    ) -> Dict:
        query = self.db.query(SalaryRecord).filter(
            SalaryRecord.employee_id == self.employee.id,
            SalaryRecord.payment_status == "paid"
        )
        if year:
            query = query.filter(SalaryRecord.year == year)
        if month_from:
            query = query.filter(SalaryRecord.month >= month_from)
        if month_to:
            query = query.filter(SalaryRecord.month <= month_to)

        records = query.order_by(SalaryRecord.year.desc(), SalaryRecord.month.desc()).all()

        if not records:
            return {"status": "no_data", "message": "No salary records found.", "records": []}

        result = [{
            "salary_record_id": r.id,
            "month": r.month,
            "month_name": MONTH_NAMES.get(r.month, ""),
            "year": r.year,
            "net_salary": r.net_salary,
            "payment_status": r.payment_status,
            "download_url": f"/api/v1/salary/slips/{r.id}/download"
        } for r in records]

        return {
            "status": "success",
            "total_records": len(result),
            "records": result,
            "action": "show_salary_list"
        }

    async def _get_document(self, document_type: str) -> Dict:
        doc = self.db.query(Document).filter(
            Document.employee_id == self.employee.id,
            Document.document_type == document_type,
            Document.status == "active"
        ).order_by(Document.created_at.desc()).first()

        if not doc:
            return {
                "status": "not_found",
                "message": f"No {document_type.replace('_', ' ').title()} found. Please contact HR.",
                "document_type": document_type
            }

        return {
            "status": "success",
            "document_id": doc.id,
            "document_name": doc.document_name,
            "document_type": document_type,
            "created_at": str(doc.created_at.date() if doc.created_at else ""),
            "download_url": f"/api/v1/documents/{doc.id}/download",
            "action": "download_document",
            "action_data": {"document_id": doc.id}
        }

    async def _list_documents(self) -> Dict:
        docs = self.db.query(Document).filter(
            Document.employee_id == self.employee.id,
            Document.status == "active"
        ).order_by(Document.created_at.desc()).all()

        if not docs:
            return {
                "status": "no_data",
                "message": "No documents found. Please contact HR.",
                "documents": []
            }

        result = [{
            "document_id": d.id,
            "document_name": d.document_name,
            "document_type": d.document_type,
            "created_at": str(d.created_at.date() if d.created_at else ""),
            "download_url": f"/api/v1/documents/{d.id}/download"
        } for d in docs]

        return {
            "status": "success",
            "total": len(result),
            "documents": result,
            "action": "show_documents"
        }

    async def _get_notifications(self, unread_only: bool = False) -> Dict:
        query = self.db.query(Notification).filter(
            Notification.employee_id == self.employee.id
        )
        if unread_only:
            query = query.filter(Notification.is_read == False)

        notifications = query.order_by(Notification.created_at.desc()).limit(10).all()

        unread_count = self.db.query(Notification).filter(
            Notification.employee_id == self.employee.id,
            Notification.is_read == False
        ).count()

        result = [{
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.notification_type,
            "is_read": n.is_read,
            "priority": n.priority,
            "created_at": n.created_at.strftime("%d %b %Y %H:%M") if n.created_at else None
        } for n in notifications]

        return {
            "status": "success",
            "unread_count": unread_count,
            "notifications": result
        }

    async def _get_announcements(self) -> Dict:
        from datetime import datetime
        announcements = self.db.query(Announcement).filter(
            Announcement.is_active == True,
            Announcement.publish_at <= datetime.now()
        ).order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc()).limit(5).all()

        result = [{
            "id": a.id,
            "title": a.title,
            "content": a.content[:200] + "..." if len(a.content) > 200 else a.content,
            "category": a.category,
            "priority": a.priority,
            "is_pinned": a.is_pinned,
            "published_at": a.publish_at.strftime("%d %b %Y") if a.publish_at else None
        } for a in announcements]

        return {
            "status": "success",
            "count": len(result),
            "announcements": result
        }

    async def _generate_pdf_letter(self, title: str, content: str) -> Dict:
        from app.api.documents import create_pdf_from_text
        from datetime import datetime
        import os
        from app.core.config import settings
        
        doc_dir = settings.documents_dir
        os.makedirs(doc_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = f"{timestamp}_{title.replace(' ', '_')}.pdf"
        file_path = os.path.join(doc_dir, safe_name)
        
        try:
            create_pdf_from_text(content, file_path)
        except Exception as e:
            return {"status": "error", "message": f"Failed to generate PDF: {str(e)}"}
            
        file_size_kb = os.path.getsize(file_path) // 1024
        
        doc = Document(
            employee_id=self.employee.id,
            document_type="other",
            document_name=title,
            description="Generated by AI Assistant on request",
            file_path=file_path,
            file_name=f"{title}.pdf",
            file_size_kb=file_size_kb,
            mime_type="application/pdf",
            uploaded_by=self.employee.id
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        
        return {
            "status": "success",
            "message": f"I have generated the '{title}' as a PDF document for you.",
            "document_id": doc.id,
            "document_name": doc.document_name,
            "document_type": "other",
            "created_at": str(doc.created_at.date() if doc.created_at else ""),
            "action": "download_document",
            "action_data": {"document_id": doc.id}
        }

