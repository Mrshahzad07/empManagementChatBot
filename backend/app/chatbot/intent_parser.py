"""
Intent parser for multilingual support: English, Hindi, Hinglish.
Handles relative dates, month names, financial years, abbreviations.
"""

import re
from datetime import date, timedelta
from typing import Optional, Tuple, Dict
from dateutil.relativedelta import relativedelta


MONTH_MAP = {
    # English
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
    # Abbreviations
    "jan": 1, "feb": 2, "mar": 3, "apr": 4,
    "jun": 6, "jul": 7, "aug": 8, "sep": 9, "sept": 9,
    "oct": 10, "nov": 11, "dec": 12,
    # Hindi transliterations
    "janvari": 1, "farvari": 2, "march": 3, "aprail": 4,
    "maee": 5, "june": 6, "julai": 7, "agast": 8,
    "sitambar": 9, "aktoobar": 10, "navambar": 11, "disambar": 12,
}

LEAVE_TYPE_MAP = {
    # Annual/Casual
    "vacation": "annual", "holiday": "annual", "annual": "annual",
    "casual": "casual", "chutti": "annual", "छुट्टी": "annual",
    # Sick
    "sick": "sick", "medical": "sick", "health": "sick",
    "bimaar": "sick", "बीमार": "sick", "hospital": "sick",
    # Emergency
    "emergency": "emergency", "urgent": "emergency", "achaanak": "emergency",
    "suddenly": "emergency",
    # Marriage
    "marriage": "marriage", "wedding": "marriage", "shaadi": "marriage",
    "shadi": "marriage", "vivah": "marriage",
    # Maternity / Paternity
    "maternity": "maternity", "paternity": "paternity",
    # Home
    "hometown": "annual", "ghar": "annual", "home": "annual",
}

RELATIVE_DATE_MAP = {
    "today": 0, "aaj": 0, "आज": 0,
    "tomorrow": 1, "kal": 1, "kl": 1, "kal se": 1, "कल": 1,
    "day after tomorrow": 2, "parso": 2,
    "monday": None, "tuesday": None, "wednesday": None,
    "thursday": None, "friday": None, "saturday": None, "sunday": None,
    # Hindi weekdays
    "somvar": None, "mangalvar": None, "budhvar": None,
    "guruvar": None, "shukravar": None, "shanivar": None, "ravivar": None,
}

WEEKDAY_MAP = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
    "mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6,
    "somvar": 0, "mangalvar": 1, "budhvar": 2, "guruvar": 3,
    "shukravar": 4, "shanivar": 5, "ravivar": 6
}


def parse_leave_type(text: str) -> str:
    """Extract leave type from natural language."""
    text_lower = text.lower()
    for keyword, leave_type in LEAVE_TYPE_MAP.items():
        if keyword in text_lower:
            return leave_type
    return "annual"  # default


def parse_date_from_text(text: str, today: Optional[date] = None) -> Optional[date]:
    """Parse a date from natural language text."""
    if today is None:
        today = date.today()

    text_lower = text.lower().strip()

    # Direct relative dates
    if any(w in text_lower for w in ("today", "aaj", "आज")):
        return today
    if any(w in text_lower for w in ("day after tomorrow", "parso")):
        return today + timedelta(days=2)
    if any(w in text_lower for w in ("tomorrow", "kal", "kl", "कल", "kal se")):
        return today + timedelta(days=1)

    # Next week
    if "next week" in text_lower or "agli week" in text_lower:
        days_until_monday = (7 - today.weekday()) % 7 or 7
        return today + timedelta(days=days_until_monday)

    # Weekday names
    for day_name, day_num in WEEKDAY_MAP.items():
        if day_name in text_lower:
            days_ahead = day_num - today.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            return today + timedelta(days=days_ahead)

    # DD Month YYYY or DD/MM/YYYY
    date_patterns = [
        r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})',
        r'(\d{1,2})\s+(?:of\s+)?([a-zA-Z]+)\s+(\d{4})',
        r'([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})',
        r'(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)',
    ]

    for pattern in date_patterns:
        match = re.search(pattern, text_lower)
        if match:
            groups = match.groups()
            try:
                if len(groups) == 3:
                    g1, g2, g3 = groups
                    if g1.isdigit() and g2.isdigit() and g3.isdigit():
                        return date(int(g3), int(g2), int(g1))
                    elif g1.isdigit() and g2.isalpha():
                        month = MONTH_MAP.get(g2.lower())
                        if month:
                            return date(int(g3), month, int(g1))
                    elif g1.isalpha():
                        month = MONTH_MAP.get(g1.lower())
                        if month:
                            return date(int(g3), month, int(g2))
                elif len(groups) == 2:
                    g1, g2 = groups
                    if g1.isdigit() and g2.isalpha():
                        month = MONTH_MAP.get(g2.lower())
                        if month:
                            return date(today.year, month, int(g1))
            except (ValueError, KeyError):
                pass

    return None


def parse_date_range(text: str, today: Optional[date] = None) -> Tuple[Optional[date], Optional[date], Optional[int]]:
    """
    Parse date range from text.
    Returns (start_date, end_date, num_days)
    """
    if today is None:
        today = date.today()

    text_lower = text.lower()

    # "from DATE to DATE" / "DATE se DATE tak"
    range_patterns = [
        r'from\s+(.+?)\s+to\s+(.+?)(?:\s|$)',
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{4})\s+(?:to|se)\s+(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
        r'(\d{1,2}\s+\w+)\s+(?:to|-)\s+(\d{1,2}\s+\w+)',
    ]

    for pattern in range_patterns:
        match = re.search(pattern, text_lower)
        if match:
            start_str, end_str = match.group(1), match.group(2)
            start = parse_date_from_text(start_str, today)
            end = parse_date_from_text(end_str, today)
            if start and end:
                days = (end - start).days + 1
                return start, end, days

    # "N days" starting from relative date
    days_match = re.search(r'(\d+)\s*(?:day|din)', text_lower)
    if days_match:
        num_days = int(days_match.group(1))

        # Find start date
        start = None
        if "tomorrow" in text_lower or "kal" in text_lower:
            start = today + timedelta(days=1)
        elif "today" in text_lower or "aaj" in text_lower:
            start = today
        else:
            start = today + timedelta(days=1)  # default to tomorrow

        end = start + timedelta(days=num_days - 1)
        return start, end, num_days

    # "next N days"
    next_days = re.search(r'next\s+(\d+)\s*day', text_lower)
    if next_days:
        num_days = int(next_days.group(1))
        start = today + timedelta(days=1)
        end = start + timedelta(days=num_days - 1)
        return start, end, num_days

    # "next week"
    if "next week" in text_lower:
        days_until_monday = (7 - today.weekday()) % 7 or 7
        start = today + timedelta(days=days_until_monday)
        end = start + timedelta(days=4)  # Mon to Fri
        return start, end, 5

    # "Monday to Friday"
    weekday_range = re.search(r'(\w+day)\s+to\s+(\w+day)', text_lower)
    if weekday_range:
        start_day_name = weekday_range.group(1).lower()
        end_day_name = weekday_range.group(2).lower()
        start_day = WEEKDAY_MAP.get(start_day_name)
        end_day = WEEKDAY_MAP.get(end_day_name)
        if start_day is not None and end_day is not None:
            days_ahead_start = (start_day - today.weekday()) % 7 or 7
            start = today + timedelta(days=days_ahead_start)
            days_ahead_end = (end_day - today.weekday()) % 7
            if days_ahead_end <= days_ahead_start:
                days_ahead_end += 7
            end = today + timedelta(days=days_ahead_end)
            return start, end, (end - start).days + 1

    # Single date → 1 day
    single_date = parse_date_from_text(text, today)
    if single_date:
        return single_date, single_date, 1

    return None, None, None


def parse_month_year(text: str) -> Tuple[Optional[int], Optional[int]]:
    """Extract month and year from text like 'March 2025', 'march salary', 'last month'."""
    text_lower = text.lower()
    today = date.today()

    if "last month" in text_lower or "pichle mahine" in text_lower:
        last = today.replace(day=1) - timedelta(days=1)
        return last.month, last.year

    if "this month" in text_lower or "is mahine" in text_lower:
        return today.month, today.year

    # Month name + year
    for month_name, month_num in MONTH_MAP.items():
        if month_name in text_lower:
            year_match = re.search(r'20\d{2}', text)
            year = int(year_match.group()) if year_match else today.year
            return month_num, year

    # Year only
    year_match = re.search(r'20\d{2}', text)
    if year_match:
        return None, int(year_match.group())

    return None, None


def parse_financial_year(text: str) -> Tuple[Optional[int], Optional[int]]:
    """Parse financial year like 'FY 2024-25', 'previous financial year'."""
    today = date.today()
    current_fy_start = today.year if today.month >= 4 else today.year - 1

    text_lower = text.lower()

    if "previous financial year" in text_lower or "last financial year" in text_lower or "pichla fy" in text_lower:
        return current_fy_start - 1, current_fy_start

    if "this financial year" in text_lower or "current financial year" in text_lower:
        return current_fy_start, current_fy_start + 1

    fy_match = re.search(r'fy\s*(\d{4})[-–](\d{2,4})', text_lower)
    if fy_match:
        start_year = int(fy_match.group(1))
        return start_year, start_year + 1

    return None, None


def detect_language(text: str) -> str:
    """Detect if text is Hindi, English, or Hinglish."""
    hindi_chars = len(re.findall(r'[\u0900-\u097F]', text))
    total_chars = len(text.replace(" ", ""))

    if total_chars == 0:
        return "english"

    hindi_ratio = hindi_chars / total_chars

    if hindi_ratio > 0.5:
        return "hindi"
    elif hindi_ratio > 0.1:
        return "hinglish"
    else:
        # Check for Hinglish keywords
        hinglish_words = ["kal", "aaj", "chutti", "bimaar", "ghar", "karo", "chahiye",
                          "mujhe", "meri", "mera", "kya", "hai", "hain", "please", "bhai"]
        lower_text = text.lower()
        if any(word in lower_text for word in hinglish_words):
            return "hinglish"
        return "english"
