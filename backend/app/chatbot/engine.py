"""
AI Chat Engine using Groq (Llama 3.3 70B) with tool calling.
Supports multi-turn conversations, context memory, multilingual input.
"""

import json
import time
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.employee import Employee
from app.models.misc import ChatSession, ChatMessage
from app.chatbot.tools import TOOL_DEFINITIONS, ToolExecutor
from app.chatbot.intent_parser import detect_language


SYSTEM_PROMPT = """You are an AI HR Assistant for {company_name}. You help employees with HR self-service tasks.

Your capabilities:
- Check and manage leave balances and applications
- Provide salary slips and salary information
- Access HR documents (offer letters, appointment letters, Form 16, etc.)
- Answer questions about company policies
- Show notifications and announcements

Rules:
1. NEVER make up salary, leave, or employee data. Always use the provided tools.
2. For every HR-related request, call the appropriate tool first, then respond.
3. CRITICAL: Identify the language the employee is using (English, Hindi, or Hinglish) and STRICTLY respond ONLY in that exact same language.
4. Be conversational, warm, and professional.
5. CRITICAL: When an employee or HR wants to apply for leave, you MUST ask them for a specific reason for the leave if they haven't provided one in their initial request. DO NOT call `apply_leave` or proceed with the application until the user has explicitly provided a valid reason.
6. When applying for leave, confirm all details (dates, reason, type) before calling apply_leave.
7. After getting tool results, provide a clear, formatted response to the employee.
8. For date parsing: "tomorrow" means next day, "kal" means tomorrow in Hindi.
9. Always show monetary values in Indian Rupee format (₹).
10. If a tool returns an error, explain it clearly and suggest what to do.
11. Keep responses concise and actionable.
12. If an employee wants to cancel an existing or pending leave, confirm with them and use the `cancel_leave` tool.
13. CRITICAL: If an employee asks you to write, draft, or provide a letter (e.g. sick leave application, cover letter, generic letter), you MUST use the `generate_pdf_letter` tool to give them a downloadable PDF. DO NOT just write the raw text format of the letter in the chat.

Employee information: {employee_info}

Current date: {current_date}
"""


class ChatEngine:
    def __init__(self, db: Session, employee: Employee):
        self.db = db
        self.employee = employee
        self.tool_executor = ToolExecutor(db, employee)
        self._client = None

    def _get_client(self):
        if self._client is None:
            if settings.AI_PROVIDER == "groq":
                from groq import Groq
                self._client = Groq(api_key=settings.GROQ_API_KEY)
            else:
                # Ollama via OpenAI-compatible API
                from openai import OpenAI
                self._client = OpenAI(
                    base_url=f"{settings.OLLAMA_BASE_URL}/v1",
                    api_key="ollama"
                )
        return self._client

    def _get_or_create_session(self, session_id: Optional[str] = None) -> ChatSession:
        if session_id:
            session = self.db.query(ChatSession).filter(
                ChatSession.id == session_id,
                ChatSession.employee_id == self.employee.id
            ).first()
            if session:
                return session

        session = ChatSession(
            id=str(uuid.uuid4()),
            employee_id=self.employee.id,
            title="New Conversation",
            status="active",
            context_data={}
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def _get_conversation_history(self, session: ChatSession, limit: int = 20) -> List[Dict]:
        messages = self.db.query(ChatMessage).filter(
            ChatMessage.session_id == session.id,
            ChatMessage.role.in_(["user", "assistant"])
        ).order_by(ChatMessage.created_at.desc()).limit(limit).all()

        messages.reverse()

        history = []
        for msg in messages:
            history.append({"role": msg.role, "content": msg.content})
        return history

    def _save_message(
        self,
        session: ChatSession,
        role: str,
        content: str,
        tool_name: Optional[str] = None,
        tool_args: Optional[dict] = None,
        tool_result: Optional[dict] = None,
        action_taken: Optional[str] = None,
        tokens_used: Optional[int] = None,
        response_time_ms: Optional[int] = None
    ) -> ChatMessage:
        msg = ChatMessage(
            session_id=session.id,
            employee_id=self.employee.id,
            role=role,
            content=content,
            tool_name=tool_name,
            tool_args=tool_args,
            tool_result=tool_result,
            action_taken=action_taken,
            tokens_used=tokens_used,
            response_time_ms=response_time_ms
        )
        self.db.add(msg)
        session.message_count = (session.message_count or 0) + 1
        session.last_message_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(msg)
        return msg

    def _update_session_title(self, session: ChatSession, first_message: str):
        if session.message_count and session.message_count <= 2:
            title = first_message[:50] + ("..." if len(first_message) > 50 else "")
            session.title = title
            self.db.commit()

    async def process_message(
        self,
        user_message: str,
        session_id: Optional[str] = None
    ) -> Tuple[ChatMessage, str, Optional[Dict]]:
        """
        Process a user message through the AI engine.
        Returns (assistant_message_record, session_id, tool_result)
        """
        start_time = time.time()

        # Get/create session
        session = self._get_or_create_session(session_id)

        # Save user message
        self._save_message(session, "user", user_message)
        self._update_session_title(session, user_message)

        # Build system prompt
        lang = detect_language(user_message)
        employee_info = (
            f"Name: {self.employee.full_name}, ID: {self.employee.employee_id}, "
            f"Department: {self.employee.department.name if self.employee.department else 'N/A'}, "
            f"Designation: {self.employee.designation or 'N/A'}"
        )
        system_content = SYSTEM_PROMPT.format(
            company_name=settings.COMPANY_NAME,
            employee_info=employee_info,
            current_date=datetime.now().strftime("%A, %d %B %Y")
        )

        if lang == "hindi":
            system_content += "\n\nCRITICAL: The employee is writing in Hindi. You MUST respond ONLY in Hindi."
        elif lang == "hinglish":
            system_content += "\n\nCRITICAL: The employee is writing in Hinglish. You MUST respond ONLY in Hinglish. Do NOT use pure English."
        else:
            system_content += "\n\nCRITICAL: The employee is writing in English. You MUST respond ONLY in English."

        # Get conversation history
        history = self._get_conversation_history(session)

        # Build messages
        messages = [{"role": "system", "content": system_content}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        # Get AI model name
        model = settings.GROQ_MODEL if settings.AI_PROVIDER == "groq" else settings.OLLAMA_MODEL

        tool_result_data = None
        final_response = ""
        tokens_used = 0
        tool_name_used = None
        tool_args_used = None

        try:
            client = self._get_client()

            # First AI call with tools
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                tools=TOOL_DEFINITIONS,
                tool_choice="auto",
                max_tokens=2048,
                temperature=0.3
            )

            message = response.choices[0].message
            tokens_used = response.usage.total_tokens if response.usage else 0

            # Check if AI called a tool
            if message.tool_calls:
                tool_call = message.tool_calls[0]
                tool_name_used = tool_call.function.name
                try:
                    tool_args_used = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    tool_args_used = {}

                # Execute tool
                tool_result_data = await self.tool_executor.execute(tool_name_used, tool_args_used)

                # Send tool result back to AI for final response
                messages.append({"role": "assistant", "content": message.content or "", "tool_calls": [
                    {
                        "id": tool_call.id,
                        "type": "function",
                        "function": {"name": tool_name_used, "arguments": tool_call.function.arguments}
                    }
                ]})
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(tool_result_data)
                })

                # Second AI call to formulate final response
                final_response_obj = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=1024,
                    temperature=0.3
                )
                final_response = final_response_obj.choices[0].message.content or ""
                if final_response_obj.usage:
                    tokens_used += final_response_obj.usage.total_tokens
            else:
                # Direct response without tool call
                final_response = message.content or "I'm sorry, I couldn't process your request. Please try again."

        except Exception as e:
            error_str = str(e)
            lower_msg = user_message.lower()

            # Check history to see if we were asking for leave dates
            is_leave_context = False
            if history:
                last_msg = history[-1]
                if last_msg["role"] == "assistant" and "apply for leave" in last_msg["content"].lower():
                    is_leave_context = True

            # Simple fallback intent parser when AI is down
            if is_leave_context or any(k in lower_msg for k in ["leave", "chutti", "vacation", "holiday"]):
                from app.chatbot.intent_parser import parse_leave_type, parse_date_range
                leave_type = parse_leave_type(user_message)
                start, end, days = parse_date_range(user_message)
                
                if start and end:
                    tool_name_used = "apply_leave"
                    tool_args_used = {
                        "leave_type": leave_type,
                        "start_date": start.isoformat(),
                        "end_date": end.isoformat(),
                        "reason": user_message
                    }
                    try:
                        tool_result_data = await self.tool_executor.execute(tool_name_used, tool_args_used)
                        if tool_result_data.get("status") == "success":
                            final_response = f"I've successfully submitted a {leave_type} leave request for {days} day(s) from {start} to {end}."
                        else:
                            final_response = f"I couldn't apply for leave: {tool_result_data.get('message', 'Unknown error')}."
                    except Exception as te:
                        final_response = f"Error applying leave: {str(te)}"
                else:
                    final_response = "I see you want to apply for leave. Please tell me the start and end dates clearly (e.g., 'I need leave tomorrow')."
            elif any(k in lower_msg for k in ["salary", "payslip", "slip"]):
                now = datetime.now()
                # Default to previous month
                m = now.month - 1 if now.month > 1 else 12
                y = now.year if now.month > 1 else now.year - 1
                
                tool_name_used = "get_salary_slip"
                tool_args_used = {"month": m, "year": y}
                try:
                    tool_result_data = await self.tool_executor.execute(tool_name_used, tool_args_used)
                    if tool_result_data.get("status") == "success":
                        final_response = f"Here is your salary slip for {m}/{y}. Download it here: {tool_result_data.get('download_url', '#')}"
                    else:
                        final_response = f"I couldn't find your salary slip: {tool_result_data.get('message', 'Not found')}."
                except Exception as te:
                    final_response = f"Error fetching salary slip: {str(te)}"
            elif "api_key" in error_str.lower() or "authentication" in error_str.lower():
                final_response = (
                    "⚠️ AI service is not configured. Please set up your GROQ_API_KEY in the .env file.\n\n"
                    "You can still use all other features of the platform through the dashboard."
                )
            elif "model" in error_str.lower():
                final_response = f"AI model error: {error_str}. Please check your configuration."
            else:
                final_response = (
                    "I'm having trouble connecting to the AI service right now. "
                    "Please try again in a moment or use the dashboard directly."
                )

        response_time_ms = int((time.time() - start_time) * 1000)

        # Save assistant message
        assistant_msg = self._save_message(
            session, "assistant", final_response,
            tool_name=tool_name_used,
            tool_args=tool_args_used,
            tool_result=tool_result_data,
            action_taken=tool_name_used,
            tokens_used=tokens_used,
            response_time_ms=response_time_ms
        )

        return assistant_msg, session.id, tool_result_data
