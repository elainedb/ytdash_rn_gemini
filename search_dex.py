import zipfile
import re

apk_path = "android/app/build/outputs/apk/release/app-release.apk"

with zipfile.ZipFile(apk_path, 'r') as zip_ref:
    for file_name in zip_ref.namelist():
        if file_name.endswith('.dex'):
            data = zip_ref.read(file_name)
            # Search for Lcom/example/ytdash_rn/MainActivity;
            matches = list(re.finditer(b"Lcom/example/ytdash_rn/[a-zA-Z0-9$_]+;", data))
            if matches:
                print(f"Found in {file_name}:")
                for match in matches:
                    print("  ", match.group(0).decode('utf-8', errors='ignore'))
            
            # Search for general MainActivity
            main_activity_matches = list(re.finditer(b"L[^;]*MainActivity;", data))
            if main_activity_matches:
                print(f"General MainActivity matches in {file_name}:")
                for match in main_activity_matches:
                    print("  ", match.group(0).decode('utf-8', errors='ignore'))
