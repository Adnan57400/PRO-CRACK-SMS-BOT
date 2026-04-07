# bot_manager.py — Crack SMS v20 Professional Edition
# Child-bot process manager with registry support
import os, json, subprocess, signal, time, shutil, ast, sys
from typing import Optional

BOT_DIR      = os.path.join(os.path.dirname(os.path.abspath(__file__)), "child_bots")
REGISTRY_FILE = os.path.join(BOT_DIR, "registry.json")
os.makedirs(BOT_DIR, exist_ok=True)

def _load_reg() -> dict:
    try:
        if os.path.exists(REGISTRY_FILE):
            with open(REGISTRY_FILE) as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def save_registry(reg: dict):
    os.makedirs(BOT_DIR, exist_ok=True)
    with open(REGISTRY_FILE, "w") as f:
        json.dump(reg, f, indent=2)

_save_reg = save_registry   # public alias

# --- PUBLIC FUNCTIONS ---
load_registry = _load_reg   # for bot.py compatibility

def get_all_bots() -> list:
    reg = _load_reg()
    result = []
    for bid, info in reg.items():
        running = is_running(bid)
        result.append({**info, "id": bid, "running": running})
    return result

list_bots = get_all_bots   # alias for bot.py

def get_bot_info(bid: str) -> Optional[dict]:
    reg = _load_reg()
    info = reg.get(bid)
    if info:
        return {**info, "id": bid, "running": is_running(bid)}
    return None

def is_running(bid: str) -> bool:
    reg = _load_reg()
    info = reg.get(bid, {})
    pid = info.get("pid")
    if not pid:
        return False
    try:
        os.kill(int(pid), 0)
        return True
    except (ProcessLookupError, OSError):
        return False

def create_bot_folder(bid: str, config: dict) -> str:
    folder = os.path.join(BOT_DIR, bid)
    os.makedirs(folder, exist_ok=True)
    # Copy main bot files
    bot_src = os.path.dirname(os.path.abspath(__file__))
    for fname in ["database.py", "bot_manager.py", "utils.py",
                  "requirements.txt", "countries.json", "dex.txt"]:
        src = os.path.join(bot_src, fname)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(folder, fname))
    # Also copy bot.py (the child will run with IS_CHILD_BOT=True)
    shutil.copy2(os.path.join(bot_src, "bot.py"), os.path.join(folder, "bot.py"))
    # Write child config
    with open(os.path.join(folder, "config.json"), "w") as f:
        json.dump({**config, "IS_CHILD_BOT": True}, f, indent=2)
    return folder

def start_bot(bid: str) -> tuple:
    reg   = _load_reg()
    info  = reg.get(bid)
    if not info:
        return False, "Bot not found in registry"
    folder = info.get("folder") or os.path.join(BOT_DIR, bid)
    if not os.path.exists(folder):
        return False, "Bot folder not found"
    try:
        proc = subprocess.Popen(
            [sys.executable, "bot.py"],
            cwd=folder,
            stdout=open(os.path.join(folder, "bot.log"), "a"),
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
        reg[bid]["pid"] = proc.pid
        save_registry(reg)
        return True, f"Started PID {proc.pid}"
    except Exception as e:
        return False, str(e)

def stop_bot(bid: str) -> tuple:
    reg  = _load_reg()
    info = reg.get(bid, {})
    pid  = info.get("pid")
    if not pid:
        return False, "Not running"
    try:
        os.kill(int(pid), signal.SIGTERM)
        time.sleep(1)
        try:
            os.kill(int(pid), signal.SIGKILL)
        except ProcessLookupError:
            pass
        reg[bid]["pid"] = None
        save_registry(reg)
        return True, "Stopped"
    except ProcessLookupError:
        reg[bid]["pid"] = None
        save_registry(reg)
        return True, "Already stopped"
    except Exception as e:
        return False, str(e)

def restart_bot(bid: str) -> tuple:
    stop_bot(bid)
    time.sleep(2)
    return start_bot(bid)

def delete_bot(bid: str) -> tuple:
    stop_bot(bid)
    reg    = _load_reg()
    info   = reg.pop(bid, None)
    if not info:
        return False, "Not found"
    folder = info.get("folder") or os.path.join(BOT_DIR, bid)
    if os.path.exists(folder):
        shutil.rmtree(folder, ignore_errors=True)
    save_registry(reg)
    return True, "Deleted"

def get_bot_log(bid: str, lines: int = 50) -> str:
    info = get_bot_info(bid)
    if not info:
        return "Bot not found."
    folder = info.get("folder") or os.path.join(BOT_DIR, bid)
    log_file = os.path.join(folder, "bot.log")
    if not os.path.exists(log_file):
        return "No log file."
    try:
        with open(log_file, "r", errors="replace") as f:
            all_lines = f.readlines()
        return "".join(all_lines[-lines:])
    except Exception as e:
        return f"Error reading log: {e}"

def register_bot(bid: str, config: dict, folder: str):
    reg = _load_reg()
    reg[bid] = {**config, "folder": folder, "pid": None, "created": time.time()}
    save_registry(reg)