from datetime import datetime


def is_valid_yyyymmdd(value: str) -> bool:
    if len(value) != 8 or not value.isdigit():
        return False
    try:
        datetime.strptime(value, "%Y%m%d")
        return True
    except ValueError:
        return False
