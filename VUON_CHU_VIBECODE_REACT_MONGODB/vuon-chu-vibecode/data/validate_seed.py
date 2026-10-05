"""Validate this prompt pack's source JSON without MongoDB or third-party packages.

Usage: python data/validate_seed.py
This validates files only, not the future application or its API/DB behavior.
"""
from pathlib import Path
import hashlib
import json
import unicodedata
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
errors = []
checks = 0


def check(condition, message):
    global checks
    checks += 1
    if not condition:
        errors.append(message)


def load(relative):
    return json.loads((ROOT / relative).read_text(encoding="utf-8"))


def scan_nfc(value, path):
    if isinstance(value, str):
        check(value == unicodedata.normalize("NFC", value), f"NFC: {path}")
    elif isinstance(value, dict):
        for key, item in value.items():
            scan_nfc(item, f"{path}.{key}")
    elif isinstance(value, list):
        for index, item in enumerate(value):
            scan_nfc(item, f"{path}[{index}]")


def remove_tone(text):
    # Remove tone marks only: keep breve/circumflex/horn (ă/â/ơ/ư).
    tone_marks = {"\u0300", "\u0301", "\u0303", "\u0309", "\u0323"}
    decomposed = unicodedata.normalize("NFD", text)
    return unicodedata.normalize("NFC", "".join(c for c in decomposed if c not in tone_marks))


manifest = load("data/seed-manifest.json")
datasets = {}
keys = {}
for item in manifest["datasets"]:
    name = item["collection"]
    rows = load(item["file"])
    datasets[name] = rows
    keys[name] = {row["key"] for row in rows}
    check(len(rows) == item["count"], f"Count mismatch: {name}")
    check(len(keys[name]) == len(rows), f"Duplicate key: {name}")
    scan_nfc(rows, name)

letters = datasets["letters"]
alphabet = list("AĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVXY")
vowels = set("AĂÂEÊIOÔƠUƯY")
check([row["symbol"] for row in letters] == alphabet, "Alphabet order/29 symbols")
check([row["order"] for row in letters] == list(range(1, 30)), "Alphabet order field")
check(sum(row["group"] == "vowel" for row in letters) == 12, "12 vowels")
check(sum(row["group"] == "consonant" for row in letters) == 17, "17 consonants")
for row in letters:
    check((row["symbol"] in vowels) == (row["group"] == "vowel"), f"Letter group {row['key']}")
    ex = row["example"]
    target = ex["text"][ex["targetOffset"]:ex["targetOffset"] + ex["targetLength"]]
    check(remove_tone(target).upper() == row["symbol"], f"Example target {row['key']}: {target}")
    check(row["lowerSymbol"] == row["symbol"].lower(), f"Lowercase {row['key']}")

tone_codes = {r["code"] for r in datasets["tones"]}
check(tone_codes == {"ngang", "sac", "huyen", "hoi", "nga", "nang"}, "Six tones")
check(next(r for r in datasets["tones"] if r["code"] == "ngang")["marker"] == "", "Ngang no marker")
combos = set()
for row in datasets["spellingEntries"]:
    combo = row["onset"], row["rime"], row["toneCode"]
    check(combo not in combos, f"Duplicate spelling combination: {combo}")
    combos.add(combo)
    check(row["toneCode"] in tone_codes, f"Spelling tone: {row['key']}")
    check(row["vocabularyKey"] in keys["vocabulary"], f"Spelling vocabulary: {row['key']}")
    check(remove_tone(row["word"]) == row["onset"] + row["rime"], f"Spelling word base: {row['key']}")

for row in datasets["exercises"]:
    ids = [option["id"] for option in row["options"]]
    check(len(ids) == len(set(ids)), f"Duplicate option IDs: {row['key']}")
    check(row["answer"]["optionId"] in ids, f"Invalid answer: {row['key']}")
    check(len({option["label"] for option in row["options"]}) == len(ids), f"Duplicate option labels: {row['key']}")
    for field, collection in [("targetLetterKey", "letters"), ("vocabularyKey", "vocabulary"), ("spellingEntryKey", "spellingEntries")]:
        check(not row.get(field) or row[field] in keys[collection], f"Exercise ref {row['key']}.{field}")

for row in datasets["lessons"]:
    check(all(k in keys["letters"] for k in row["letterKeys"]), f"Lesson letter refs {row['key']}")
    check(all(k in keys["exercises"] for k in row["exerciseKeys"]), f"Lesson exercise refs {row['key']}")
    check(any(row["contentKey"] in keys[c] for c in ("letters", "spellingEntries", "stories")), f"Lesson content ref {row['key']}")

for row in datasets["stories"]:
    check(row["endingExerciseKey"] in keys["exercises"], f"Story ending ref {row['key']}")
    check(all(k in keys["vocabulary"] for k in row["vocabularyKeys"]), f"Story vocabulary refs {row['key']}")
    check(len({s["id"] for s in row["scenes"]}) == len(row["scenes"]), f"Story scene IDs {row['key']}")
    for scene in row["scenes"]:
        check(len({h["id"] for h in scene["hotspots"]}) == len(scene["hotspots"]), f"Hotspot IDs {row['key']}")
        for hotspot in scene["hotspots"]:
            check(hotspot["vocabularyKey"] in keys["vocabulary"], f"Hotspot ref {row['key']}")
            check(0 <= hotspot["x"] <= 1 and 0 <= hotspot["y"] <= 1, f"Hotspot position {row['key']}")

assets = load("assets/manifest.json")["assets"]
asset_keys = {asset["key"] for asset in assets}
check(len(asset_keys) == len(assets) == 8, "Eight local registry assets")
for asset in assets:
    path = (ROOT / asset["localPath"]).resolve()
    check(path.is_relative_to(ROOT.resolve()) and path.is_file(), f"Asset path {asset['key']}")
    if path.is_file():
        check(path.stat().st_size == asset["sizeBytes"], f"Asset bytes {asset['key']}")
        check(hashlib.sha256(path.read_bytes()).hexdigest() == asset["checksum"], f"Asset checksum {asset['key']}")
        if asset["kind"] == "svg":
            svg = ET.parse(path).getroot()
            check(svg.tag.endswith("svg"), f"SVG root {asset['key']}")
            check(all(not e.tag.endswith("script") for e in svg.iter()), f"SVG script {asset['key']}")

for name in ("letters", "vocabulary", "spellingEntries", "exercises"):
    for row in datasets[name]:
        check(all(v is None for v in row["audioAssetKeys"].values()), f"No fake audio {row['key']}")
for row in datasets["rewardCatalog"]:
    check(row["assetKey"] is None or row["assetKey"] in asset_keys, f"Reward asset {row['key']}")
    check(isinstance(row["cost"], int) and row["cost"] >= 0, f"Reward cost {row['key']}")
for row in datasets["resources"]:
    check(row["status"] == "draft" and row["availability"] == "missing" and row["assetKey"] is None, f"Missing resource {row['key']}")

prompt_files = list((ROOT / "prompts").glob("[0-9][0-9]-*.md"))
check(len(prompt_files) == 20, "20 step prompts")
for prompt in prompt_files:
    text = prompt.read_text(encoding="utf-8")
    check("## Tiêu chí đạt" in text and "## Báo cáo cuối bước" in text, f"Prompt acceptance/report {prompt.name}")

print(json.dumps({"status": "FAIL" if errors else "PASS", "checks": checks, "errors": errors,
                  "counts": {name: len(rows) for name, rows in datasets.items()},
                  "scope": "Source JSON, references, local asset checksums and prompt structure only; not FE/BE/DB tests."}, ensure_ascii=False, indent=2))
raise SystemExit(1 if errors else 0)
