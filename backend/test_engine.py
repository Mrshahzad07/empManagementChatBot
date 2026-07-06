import asyncio
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.employee import Employee
from app.chatbot.engine import ChatEngine

async def test_chat():
    db = SessionLocal()
    employee = db.query(Employee).first()
    if not employee:
        print("No employee found")
        return

    engine = ChatEngine(db, employee)
    print("Sending message...")
    try:
        msg, session_id, tool_res = await engine.process_message("hello")
        print("Response:", msg.content)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test_chat())
